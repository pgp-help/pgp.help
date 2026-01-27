import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { keyStore, KeyStore, PersistenceType } from './keyStore.svelte';
import { generateKeyPair } from './pgp';
import { getKeyDetails } from './crypto';

describe('KeyStore', () => {
	let privateKeyArmor: string;
	let publicKeyArmor: string;
	let otherKeyArmor: string;

	beforeAll(async () => {
		// Generate real keys for testing
		const key1 = await generateKeyPair('Test User', 'test@example.com');
		privateKeyArmor = key1.privateKey;
		publicKeyArmor = key1.publicKey;

		const key2 = await generateKeyPair('Other User', 'other@example.com');
		otherKeyArmor = key2.publicKey;
	});

	beforeEach(() => {
		keyStore.clear();
	});

	it('adds a key', async () => {
		const key = await getKeyDetails(publicKeyArmor);
		await keyStore.addKey({ key, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(1);
		expect(keyStore.keys[0].key.getFingerprint()).toBe(key.getFingerprint());
	});

	it('prevents duplicates when adding same key twice', async () => {
		const key = await getKeyDetails(publicKeyArmor);
		await keyStore.addKey({ key, persisted: PersistenceType.DEFAULT });
		await keyStore.addKey({ key, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(1);
	});

	it('upgrades public key to private key', async () => {
		const pub = await getKeyDetails(publicKeyArmor);
		const priv = await getKeyDetails(privateKeyArmor);

		await keyStore.addKey({ key: pub, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys[0].key.isPrivate()).toBe(false);

		await keyStore.addKey({ key: priv, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(1);
		expect(keyStore.keys[0].key.isPrivate()).toBe(true);
	});

	it('ignores public key if private key exists', async () => {
		const pub = await getKeyDetails(publicKeyArmor);
		const priv = await getKeyDetails(privateKeyArmor);

		await keyStore.addKey({ key: priv, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys[0].key.isPrivate()).toBe(true);

		await keyStore.addKey({ key: pub, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(1);
		expect(keyStore.keys[0].key.isPrivate()).toBe(true);
	});

	it('handles multiple distinct keys', async () => {
		const k1 = await getKeyDetails(publicKeyArmor);
		const k2 = await getKeyDetails(otherKeyArmor);

		await keyStore.addKey({ key: k1, persisted: PersistenceType.DEFAULT });
		await keyStore.addKey({ key: k2, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(2);
	});

	it('deduplicates on load if storage is corrupted', async () => {
		// Manually corrupt storage to have duplicates
		const duplicates = [publicKeyArmor, publicKeyArmor];
		localStorage.setItem('pgp-keys-simple', JSON.stringify(duplicates));

		// Create a new KeyStore instance to trigger load()
		const newStore = new KeyStore();

		// Wait for async load
		await new Promise((resolve) => setTimeout(resolve, 50));

		// We expect 2 keys because one is from assets (pgphelp.pem) and one is the test key
		// The test key is deduplicated, so we have 1 test key + 1 asset key = 2 keys
		// However, if the asset key happens to be the same as the test key (unlikely here), it would be 1.
		// Since we don't mock import.meta.glob in this test environment easily without more setup,
		// and we know there is one key in assets/keys/pgphelp.pem.

		// Let's check if the keys are deduplicated by fingerprint.
		const fingerprints = newStore.keys.map((k) => k.key.getFingerprint());
		const uniqueFingerprints = new Set(fingerprints);
		expect(uniqueFingerprints.size).toBe(newStore.keys.length);

		// And we expect at least the test key to be there
		const testKeyFingerprint = (await getKeyDetails(publicKeyArmor)).getFingerprint();
		expect(fingerprints).toContain(testKeyFingerprint);
	});

	it('retrieves public key from private key when requested', async () => {
		const priv = await getKeyDetails(privateKeyArmor);
		await keyStore.addKey({ key: priv, persisted: PersistenceType.DEFAULT });

		const fp = priv.getFingerprint();

		// Default behavior (returns private)
		const k1 = keyStore.getKey(fp);
		expect(k1?.key.isPrivate()).toBe(true);
		expect(k1?.key.getFingerprint()).toBe(fp);

		// Request public
		const k2 = keyStore.getKey(fp, 'public');
		expect(k2?.key.isPrivate()).toBe(false);
		expect(k2?.key.getFingerprint()).toBe(fp);

		// Request private (explicit)
		const k3 = keyStore.getKey(fp, 'private');
		expect(k3?.key.isPrivate()).toBe(true);
		expect(k3?.key.getFingerprint()).toBe(fp);
	});

	it('deletes a key', async () => {
		const key = await getKeyDetails(publicKeyArmor);
		await keyStore.addKey({ key, persisted: PersistenceType.DEFAULT });
		expect(keyStore.keys).toHaveLength(1);

		await keyStore.deleteKey(key.getFingerprint());
		expect(keyStore.keys).toHaveLength(0);
	});
});
