import { getKeyDetails } from './pgp';
import type { Key } from 'openpgp';

/**
 * A simplified key store that persists a list of armored keys strings.
 * It maintains a cache of parsed Key objects.
 */
export class KeyStore {
	keys = $state<Key[]>([]);

	constructor() {
		if (typeof window !== 'undefined') {
			this.load();
		}
	}

	private async load() {
		const stored = localStorage.getItem('pgp-keys-simple');
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
		}
	}

	private save() {
		if (typeof window !== 'undefined') {
			const rawKeys = this.keys.map((k) => k.armor());
			localStorage.setItem('pgp-keys-simple', JSON.stringify(rawKeys));
		}
	}

	async addKey(key: Key) {
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

	deleteKey(fingerprint: string) {
		this.keys = this.keys.filter((k) => k.getFingerprint() !== fingerprint);
		this.save();
	}

	clear() {
		this.keys = [];
		this.save();
	}

	getKey(fingerprint: string) {
		return this.keys.find((k) => k.getFingerprint() === fingerprint);
	}
}

export const keyStore = new KeyStore();
