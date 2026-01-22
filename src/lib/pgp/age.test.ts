import { describe, it, expect } from 'vitest';
import {
	generateKeyPair,
	encryptMessage,
	decryptMessage,
	getKeyDetails,
	isAGEKeyString
} from './age';
import { AGEKeyFacade, KeyType } from './crypto';

describe('AGE Encryption', () => {
	it('generates a valid key pair', async () => {
		const { privateKey, publicKey } = await generateKeyPair();

		expect(privateKey).toMatch(/^AGE-SECRET-KEY-1/);
		expect(publicKey).toMatch(/^age1/);

		expect(isAGEKeyString(privateKey)).toBe(true);
		expect(isAGEKeyString(publicKey)).toBe(true);
	});

	it('parses keys correctly', async () => {
		const { privateKey, publicKey } = await generateKeyPair();

		const privFacade = await getKeyDetails(privateKey);
		expect(privFacade).toBeInstanceOf(AGEKeyFacade);
		expect(privFacade.type).toBe(KeyType.AGE);
		expect(privFacade.isPrivate()).toBe(true);
		expect(privFacade.getArmor()).toBe(privateKey);
		// Fingerprint should be the public key (recipient)
		expect(privFacade.getFingerprint()).toBe(publicKey);

		const pubFacade = await getKeyDetails(publicKey);
		expect(pubFacade).toBeInstanceOf(AGEKeyFacade);
		expect(pubFacade.type).toBe(KeyType.AGE);
		expect(pubFacade.isPrivate()).toBe(false);
		expect(pubFacade.getArmor()).toBe(publicKey);
		expect(pubFacade.getFingerprint()).toBe(publicKey);
	});

	it('encrypts and decrypts a message', async () => {
		const { privateKey } = await generateKeyPair();
		const privFacade = await getKeyDetails(privateKey);
		// We can encrypt using the private facade (it knows its public key)

		const message = 'Hello World from AGE!';
		const encrypted = await encryptMessage(privFacade, message);

		expect(encrypted).toContain('-----BEGIN AGE ENCRYPTED FILE-----');

		// Decrypt
		const decrypted = await decryptMessage(privFacade, encrypted);
		expect(decrypted).toBe(message);
	});

	it('encrypts with public key and decrypts with private key', async () => {
		const { privateKey, publicKey } = await generateKeyPair();
		const pubFacade = await getKeyDetails(publicKey);
		const privFacade = await getKeyDetails(privateKey);

		const message = 'Confidential Data';
		const encrypted = await encryptMessage(pubFacade, message);

		const decrypted = await decryptMessage(privFacade, encrypted);
		expect(decrypted).toBe(message);
	});

	it('fails to decrypt with wrong key', async () => {
		const pair1 = await generateKeyPair();
		const pair2 = await generateKeyPair();

		const pubFacade1 = await getKeyDetails(pair1.publicKey);
		const privFacade2 = await getKeyDetails(pair2.privateKey);

		const encrypted = await encryptMessage(pubFacade1, 'Secret');

		await expect(decryptMessage(privFacade2, encrypted)).rejects.toThrow();
	});
});
