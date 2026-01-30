import { getKeyDetails as getPGPKeyDetails } from './pgp';
import { type CryptoKey, wrapPGPKey, getKeyDetails } from './crypto';

// Re-export CryptoKey for consumers
export type { CryptoKey } from './crypto';

/**
 * Universal key parser that uses unified crypto layer
 */
export async function parseKey(text: string): Promise<CryptoKey> {
	return getKeyDetails(text);
}

const assetKeysModules = import.meta.glob('../../assets/keys/*', {
	query: '?raw',
	import: 'default',
	eager: true
});
const assetKeysRaw = Object.values(assetKeysModules) as string[];
let assetKeysCache: CryptoKey[] | null = null;

async function getAssetKeys() {
	if (assetKeysCache) return assetKeysCache;
	const promises = assetKeysRaw.map(async (armor) => {
		try {
			return await parseKey(armor);
		} catch (e) {
			console.error('Failed to parse asset key', e);
			return null;
		}
	});
	assetKeysCache = (await Promise.all(promises)).filter((k): k is CryptoKey => k !== null);
	return assetKeysCache;
}

async function getOldKeyrings() {
	// I have no real idea if this works!
	const keys = [] as KeyWrapper[];

	// Get stored key data from localStorage
	const publicKeysData = localStorage.getItem('openpgp-public-keys');
	const privateKeysData = localStorage.getItem('openpgp-private-keys');

	// Parse and read public keys
	if (publicKeysData) {
		const publicKeys = JSON.parse(publicKeysData);
		for (const keyData of publicKeys) {
			try {
				const key = await getPGPKeyDetails(keyData);
				keys.push({ key: wrapPGPKey(key), persisted: PersistenceType.LEGACY });
			} catch (e) {
				console.error('Failed to parse old public key', e);
			}
		}
	}

	// Parse and read private keys
	if (privateKeysData) {
		const privateKeys = JSON.parse(privateKeysData);
		for (const keyData of privateKeys) {
			try {
				const key = await getPGPKeyDetails(keyData);
				keys.push({ key: wrapPGPKey(key), persisted: PersistenceType.LEGACY });
			} catch (e) {
				console.error('Failed to parse old private key', e);
			}
		}
	}

	return keys;
}

export enum PersistenceType {
	ASSET = 'asset',
	LOCAL_STORAGE = 'localstorage',
	MEMORY = 'memory',
	LEGACY = 'legacy',
	DEFAULT = 'default'
}

export interface KeyWrapper {
	key: CryptoKey;
	persisted: PersistenceType;
	hasNoPassword?: boolean;
	isNew?: boolean; //missing implies false
	// Sometimes we represent a public key for which we have the private key.
	masterKey?: KeyWrapper;
}

export function asPublicKeyWrapper(wrapper: KeyWrapper): KeyWrapper {
	if (!wrapper.key.isPrivate()) {
		throw new Error('Key is already public');
	}

	return {
		key: wrapper.key.toPublic(),
		persisted: wrapper.persisted,
		hasNoPassword: wrapper.hasNoPassword,
		masterKey: wrapper
	};
}

/**
 * A simplified key store that persists a list of armored keys strings.
 * It maintains a cache of parsed Key objects.
 */
export class KeyStore {
	keys = $state<KeyWrapper[]>([]);
	isLoaded = $state(false);
	shouldPersistByDefault = $state(false);

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
					parseKey(armor).catch((e) => {
						console.error('Failed to parse stored key', e);
						return null;
					})
				);

				const parsed = (await Promise.all(promises)).filter((k): k is CryptoKey => k !== null);
				storedKeys = parsed.map((key) => ({ key, persisted: PersistenceType.LOCAL_STORAGE }));
			} catch (e) {
				console.error('Failed to load keys', e);
			}
		}

		const assetKeys = await getAssetKeys();
		const assetKeyWrappers: KeyWrapper[] = assetKeys
			.filter((k) => k !== null)
			.map((key) => ({
				key,
				persisted: PersistenceType.ASSET
			}));
		const oldKeyWrappers = await getOldKeyrings();

		const allKeys = [...storedKeys, ...assetKeyWrappers, ...oldKeyWrappers];

		// Deduplicate, preferring private keys
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const keyMap = new Map<string, KeyWrapper>();

		for (const wrapper of allKeys) {
			if (!wrapper.key) continue;
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
			const rawKeys = this.keys
				.filter((k) => k.persisted === PersistenceType.LOCAL_STORAGE)
				.map((k) => k.key.getArmor());
			const json = JSON.stringify(rawKeys);
			localStorage.setItem('pgp-keys-simple', json);
			this.lastLoadedJson = json;
		}
	}

	async addKey(wrapper: KeyWrapper) {
		await this.load();

		const fingerprint = wrapper.key.getFingerprint();
		const existingIndex = this.keys.findIndex((k) => k.key.getFingerprint() === fingerprint);

		if (existingIndex !== -1) {
			const existing = this.keys[existingIndex];

			// If the new wrapper has DEFAULT persistence, keep the existing persistence
			if (wrapper.persisted === PersistenceType.DEFAULT) {
				wrapper.persisted = existing.persisted;
			}

			// If existing key is private and new is public, keep the private key
			if (existing.key.isPrivate() && !wrapper.key.isPrivate()) {
				wrapper.key = existing.key;
			}

			this.keys[existingIndex] = wrapper;
		} else {
			if (wrapper.persisted === PersistenceType.DEFAULT) {
				wrapper.persisted = this.shouldPersistByDefault
					? PersistenceType.LOCAL_STORAGE
					: PersistenceType.MEMORY;
			}
			this.keys.push(wrapper);
		}

		this.save();
	}

	async clearPersistedKeys() {
		await this.load();
		this.keys = this.keys.filter((k) => k.persisted !== PersistenceType.LOCAL_STORAGE);
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

	getKey(fingerprint: string, type?: 'public' | 'private'): KeyWrapper {
		if (!this.isLoaded) {
			throw new Error('KeyStore not loaded');
		}

		const wrapper = this.keys.find((k) => k.key.getFingerprint() === fingerprint);
		if (wrapper && type === 'public' && wrapper.key.isPrivate()) {
			// This demote-to-public functionality is probably unused?
			// Return a wrapper with the public key
			return {
				key: wrapper.key.toPublic(),
				persisted: wrapper.persisted,
				hasNoPassword: wrapper.hasNoPassword
			};
		}
		return wrapper;
	}
}

export const keyStore = new KeyStore();
