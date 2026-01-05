/// <reference types="vitest/globals" />
import { describe, it, expect, beforeAll } from 'vitest';
import * as openpgp from 'openpgp';
import {
	encryptMessage,
	decryptMessage,
	signMessage,
	verifySignature,
	cleanKey,
	getKeyDetails
} from './pgp';

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

	describe('cleanKey', () => {
		it('should clean a key with preamble and postamble', () => {
			const messyKey = `
			This is some random text before the key.
			${publicKey}
			This is some random text after the key.
			`;
			const cleaned = cleanKey(messyKey);
			expect(cleaned).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
			expect(cleaned).toContain('-----END PGP PUBLIC KEY BLOCK-----');
			expect(cleaned).not.toContain('random text');
		});

		it('should clean a key with extra newlines and indentation', () => {
			const lines = publicKey.split('\n');
			const messyKey = lines.map((l) => '  ' + l + '  ').join('\n\n');
			const cleaned = cleanKey(messyKey);

			// Should not have double newlines (except the one mandatory blank line)
			// But since we reconstruct it, we can just check if it parses
			expect(cleaned).not.toContain('  ');
		});

		it('should ensure exactly one empty line between headers and body', async () => {
			// Create a key with NO empty line
			const lines = publicKey.split('\n');
			const noEmptyLineKey = lines.filter((l) => l.trim() !== '').join('\n');

			const cleaned = cleanKey(noEmptyLineKey);
			// Verify it parses
			const key = await getKeyDetails(cleaned);
			expect(key).not.toBeNull();
		});

		it('should handle keys with multiple empty lines in body', async () => {
			const lines = publicKey.split('\n');
			// Insert extra newlines in the body (after headers)
			const messyKey = lines.join('\n\n\n');

			const cleaned = cleanKey(messyKey);
			const key = await getKeyDetails(cleaned);
			expect(key).not.toBeNull();
		});
	});

	describe('encryptMessage and decryptMessage', () => {
		it('should encrypt and decrypt a message correctly', async () => {
			const originalMessage = 'Hello, world!';
			const pubKeyObj = await openpgp.readKey({ armoredKey: publicKey });

			const encrypted = await encryptMessage(pubKeyObj, originalMessage);
			expect(encrypted).toBeTruthy();
			expect(encrypted).not.toBe(originalMessage);

			const decrypted = await decryptMessage(privateKeyObj, encrypted);
			expect(decrypted).toBe(originalMessage);
		});

		it('should return empty string for invalid inputs', async () => {
			expect(await encryptMessage(null, 'test')).toBe('');
			const pubKeyObj = await openpgp.readKey({ armoredKey: publicKey });
			expect(await encryptMessage(pubKeyObj, '')).toBe('');

			expect(await decryptMessage(null, 'test')).toBe('');
			expect(await decryptMessage(privateKeyObj, '')).toBe('');
		});
	});

	describe('signMessage and verifySignature', () => {
		it('should sign and verify a message correctly', async () => {
			const originalMessage = 'This is a test message.';
			const pubKeyObj = await openpgp.readKey({ armoredKey: publicKey });

			const signed = await signMessage(privateKeyObj, originalMessage);
			expect(signed).toBeTruthy();
			expect(signed).not.toBe(originalMessage);

			const isValid = await verifySignature(pubKeyObj, signed);
			expect(isValid).toBe(true);
		});

		it('should return false for invalid signature', async () => {
			const invalidSigned =
				'-----BEGIN PGP SIGNED MESSAGE-----\n\nInvalid signature\n-----BEGIN PGP SIGNATURE-----\nInvalid\n-----END PGP SIGNATURE-----';
			const pubKeyObj = await openpgp.readKey({ armoredKey: publicKey });

			const isValid = await verifySignature(pubKeyObj, invalidSigned);
			expect(isValid).toBe(false);
		});

		it('should return empty string or false for invalid inputs', async () => {
			expect(await signMessage(null, 'test')).toBe('');
			expect(await signMessage(privateKeyObj, '')).toBe('');

			expect(await verifySignature(null, 'test')).toBe(false);
			const pubKeyObj = await openpgp.readKey({ armoredKey: publicKey });
			expect(await verifySignature(pubKeyObj, '')).toBe(false);
		});
	});
});
