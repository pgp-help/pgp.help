/// <reference types="vitest/globals" />
import { describe, it, expect, beforeAll } from 'vitest';
import * as openpgp from 'openpgp';
import { encryptMessage, decryptMessage, signMessage, verifySignature } from './pgp';

describe('PGP Functions', () => {
	let publicKey: string;
	let privateKeyObj: openpgp.PrivateKey;

	beforeAll(async () => {
		// Generate a test key pair
		const { privateKey: privKeyArmored, publicKey: pubKey } = await openpgp.generateKey({
			type: 'ecc',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			curve: 'ed25519' as any, //Squash type error
			userIDs: [{ name: 'Test User', email: 'test@example.com' }],
			passphrase: 'testpassphrase'
		});
		publicKey = pubKey;

		// Decrypt the private key for use in tests
		const privateKey = await openpgp.readPrivateKey({ armoredKey: privKeyArmored });
		privateKeyObj = await openpgp.decryptKey({
			privateKey,
			passphrase: 'testpassphrase'
		});
	});

	describe('encryptMessage and decryptMessage', () => {
		it('should encrypt and decrypt a message correctly', async () => {
			const originalMessage = 'Hello, world!';

			const encrypted = await encryptMessage(publicKey, originalMessage);
			expect(encrypted).toBeTruthy();
			expect(encrypted).not.toBe(originalMessage);

			const decrypted = await decryptMessage(privateKeyObj.armor(), encrypted);
			expect(decrypted).toBe(originalMessage);
		});

		it('should return empty string for invalid inputs', async () => {
			expect(await encryptMessage('', 'test')).toBe('');
			expect(await encryptMessage(publicKey, '')).toBe('');
			expect(await decryptMessage('', 'test')).toBe('');
			expect(await decryptMessage(privateKeyObj.armor(), '')).toBe('');
		});
	});

	describe('signMessage and verifySignature', () => {
		it('should sign and verify a message correctly', async () => {
			const originalMessage = 'This is a test message.';

			const signed = await signMessage(privateKeyObj.armor(), originalMessage);
			expect(signed).toBeTruthy();
			expect(signed).not.toBe(originalMessage);

			const isValid = await verifySignature(publicKey, signed);
			expect(isValid).toBe(true);
		});

		it('should return false for invalid signature', async () => {
			const invalidSigned =
				'-----BEGIN PGP SIGNED MESSAGE-----\n\nInvalid signature\n-----BEGIN PGP SIGNATURE-----\nInvalid\n-----END PGP SIGNATURE-----';

			const isValid = await verifySignature(publicKey, invalidSigned);
			expect(isValid).toBe(false);
		});

		it('should return empty string or false for invalid inputs', async () => {
			expect(await signMessage('', 'test')).toBe('');
			expect(await signMessage(privateKeyObj.armor(), '')).toBe('');
			expect(await verifySignature('', 'test')).toBe(false);
			expect(await verifySignature(publicKey, '')).toBe(false);
		});
	});
});
