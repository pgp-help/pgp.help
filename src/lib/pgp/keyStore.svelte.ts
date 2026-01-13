import { getKeyDetails } from './pgp';
import type { Key } from 'openpgp';

const assetKeysModules = import.meta.glob('../../assets/keys/*', {
	query: '?raw',
	import: 'default',
	eager: true
});
const assetKeysRaw = Object.values(assetKeysModules) as string[];
let assetKeysCache: Key[] | null = null;

async function getAssetKeys() {
	if (assetKeysCache) return assetKeysCache;
	const promises = assetKeysRaw.map((armor) =>
		getKeyDetails(armor).catch((e) => {
			console.error('Failed to parse asset key', e);
			return null;
		})
	);
	assetKeysCache = (await Promise.all(promises)).filter((k): k is Key => k !== null);
	return assetKeysCache;
}

export interface KeyWrapper {
	key: Key;
	isPersisted: boolean;
	hasNoPassword?: boolean;
}

/**
 * A simplified key store that persists a list of armored keys strings.
 * It maintains a cache of parsed Key objects.
 */
export class KeyStore {
	keys = $state<KeyWrapper[]>([]);
	isLoaded = $state(false);
	shouldPersistByDefault = $state(true);

	private loadPromise: Promise<void> | undefined;
	private lastLoadedJson: string | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadPromise = this.load();
			const pref = localStorage.getItem('pgp-persist-default');
			if (pref !== null) {
				this.shouldPersistByDefault = pref === 'true';
			}
		} else {
			this.isLoaded = true;
		}
	}

	setPersistDefault(value: boolean) {
		this.shouldPersistByDefault = value;
		if (typeof window !== 'undefined') {
			localStorage.setItem('pgp-persist-default', String(value));
		}
	}

	private async load() {
		const stored = localStorage.getItem('pgp-keys-simple');
		if (this.isLoaded && stored === this.lastLoadedJson) return;

		let storedKeys: KeyWrapper[] = [];

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

				const parsed = (await Promise.all(promises)).filter((k): k is Key => k !== null);
				storedKeys = parsed.map((key) => ({ key, isPersisted: true }));
			} catch (e) {
				console.error('Failed to load keys', e);
			}
		}

		const assetKeys = await getAssetKeys();
		const assetKeyWrappers: KeyWrapper[] = assetKeys.map((key) => ({
			key,
			isPersisted: false
		}));

		const allKeys = [...storedKeys, ...assetKeyWrappers];

		// Deduplicate, preferring private keys
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const keyMap = new Map<string, KeyWrapper>();

		for (const wrapper of allKeys) {
			const fingerprint = wrapper.key.getFingerprint();
			const existing = keyMap.get(fingerprint);

			if (existing) {
				if (wrapper.key.isPrivate() && !existing.key.isPrivate()) {
					// Upgrade to private key
					// If we are upgrading from a persisted public key to a non-persisted private key (asset),
					// we keep the non-persisted wrapper (so it won't be saved to localStorage, but is available).
					// If the user wants to persist it, they can add it explicitly.
					keyMap.set(fingerprint, wrapper);
				}
				// If existing is private, we keep it.
				// If both are public, we keep existing (which comes from storage first, so persisted one wins).
			} else {
				keyMap.set(fingerprint, wrapper);
			}
		}

		this.keys = Array.from(keyMap.values());
		this.lastLoadedJson = stored;
		this.isLoaded = true;
	}

	private save() {
		if (!this.isLoaded) {
			throw new Error('Cannot save before loading');
		}
		if (typeof window !== 'undefined') {
			const rawKeys = this.keys.filter((k) => k.isPersisted).map((k) => k.key.armor());
			const json = JSON.stringify(rawKeys);
			localStorage.setItem('pgp-keys-simple', json);
			this.lastLoadedJson = json;
		}
	}

	async addKey(key: Key, persist: boolean = this.shouldPersistByDefault, hasNoPassword?: boolean) {
		await this.load();

		const fingerprint = key.getFingerprint();
		const isPrivate = key.isPrivate();

		const existingIndex = this.keys.findIndex((k) => k.key.getFingerprint() === fingerprint);

		if (existingIndex !== -1) {
			const existing = this.keys[existingIndex];

			if (!existing.key.isPrivate() && isPrivate) {
				// Upgrade to private
				this.keys[existingIndex] = { key, isPersisted: persist, hasNoPassword };
			} else {
				// If key exists, we might want to update persistence status
				if (persist && !existing.isPersisted) {
					existing.isPersisted = true;
				}
				// Update hasNoPassword if provided
				if (hasNoPassword !== undefined) {
					existing.hasNoPassword = hasNoPassword;
				}
				// If persist is false, we don't change existing persistence (don't un-persist)
			}
		} else {
			this.keys.push({ key, isPersisted: persist, hasNoPassword });
		}

		this.save();
	}

	async deleteKey(fingerprint: string) {
		await this.load();
		this.keys = this.keys.filter((k) => k.key.getFingerprint() !== fingerprint);
		this.save();
	}

	async clear() {
		await this.load();
		this.keys = [];
		this.save();
	}

	getKey(fingerprint: string, type?: 'public' | 'private'): KeyWrapper | undefined {
		if (!this.isLoaded) {
			throw new Error('KeyStore not loaded');
		}

		const wrapper = this.keys.find((k) => k.key.getFingerprint() === fingerprint);
		if (wrapper && type === 'public' && wrapper.key.isPrivate()) {
			// Return a wrapper with the public key
			return {
				key: wrapper.key.toPublic(),
				isPersisted: wrapper.isPersisted,
				hasNoPassword: wrapper.hasNoPassword
			};
		}
		return wrapper;
	}
}

export const keyStore = new KeyStore();
