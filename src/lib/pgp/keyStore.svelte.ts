import { getKeyDetails } from './pgp';
import type { Key } from 'openpgp';

/**
 * A simplified key store that persists a list of armored keys strings.
 * It maintains a cache of parsed Key objects.
 */
export class KeyStore {
	keys = $state<Key[]>([]);
	isLoaded = $state(false);
	private loadPromise: Promise<void> | undefined;
	private lastLoadedJson: string | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadPromise = this.load();
		} else {
			this.isLoaded = true;
		}
	}

	private async load() {
		const stored = localStorage.getItem('pgp-keys-simple');
		if (this.isLoaded && stored === this.lastLoadedJson) return;

		if (stored) {
			try {
				const rawKeys = JSON.parse(stored);
				if (!Array.isArray(rawKeys)) {
					throw new Error('Stored keys is not an array');
				}

				// Parse all keys in parallel
				const promises = rawKeys.map((armor) =>
					getKeyDetails(armor).catch((e) => {
						console.error('Failed to parse stored key', e);
						return null;
					})
				);

				const results = (await Promise.all(promises)).filter((k): k is Key => k !== null);

				// Deduplicate
				const uniqueKeys: Key[] = [];
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const seen = new Set<string>();

				for (const key of results) {
					const fingerprint = key.getFingerprint();
					if (seen.has(fingerprint)) continue;
					seen.add(fingerprint);
					uniqueKeys.push(key);
				}
				this.keys = uniqueKeys;
			} catch (e) {
				console.error('Failed to load keys', e);
			}
		} else {
			this.keys = [];
		}
		this.lastLoadedJson = stored;
		this.isLoaded = true;
	}

	private save() {
		if (!this.isLoaded) {
			throw new Error('Cannot save before loading');
		}
		if (typeof window !== 'undefined') {
			const rawKeys = this.keys.map((k) => k.armor());
			const json = JSON.stringify(rawKeys);
			localStorage.setItem('pgp-keys-simple', json);
			this.lastLoadedJson = json;
		}
	}

	async addKey(key: Key) {
		await this.load();

		const fingerprint = key.getFingerprint();
		const isPrivate = key.isPrivate();

		const existingIndex = this.keys.findIndex((k) => k.getFingerprint() === fingerprint);

		if (existingIndex !== -1) {
			const existing = this.keys[existingIndex];
			// Generally if we already habe a key with this fingerprint there's nothing to do.
			// But if existing is public and new is private, we upgrade.

			if (!existing.isPrivate() && isPrivate) {
				// Upgrade
				this.keys[existingIndex] = key;
			} else {
				return; // Skip.
			}
		} else {
			this.keys.push(key);
		}

		this.save();
	}

	async deleteKey(fingerprint: string) {
		await this.load();
		this.keys = this.keys.filter((k) => k.getFingerprint() !== fingerprint);
		this.save();
	}

	async clear() {
		await this.load();
		this.keys = [];
		this.save();
	}

	getKey(fingerprint: string, type?: 'public' | 'private') {
		if (!this.isLoaded) {
			throw new Error('KeyStore not loaded');
		}
		// TODO: This defaults to returning private key if type is not specified.
		// We should make this more explicit!

		const key = this.keys.find((k) => k.getFingerprint() === fingerprint);
		if (key && type === 'public' && key.isPrivate()) {
			return key.toPublic();
		}
		return key;
	}
}

export const keyStore = new KeyStore();
