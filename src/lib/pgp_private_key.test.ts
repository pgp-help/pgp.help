import { describe, it, expect } from 'vitest';
import * as openpgp from 'openpgp';
import { decryptPrivateKey, decryptMessage, encryptMessage } from './pgp';

describe('PGP Private Key Usage', () => {
	it('should generate a key pair, decrypt private key, and decrypt a message', async () => {
		const passphrase = 'test-passphrase';
		const { privateKey, publicKey } = await openpgp.generateKey({
			type: 'ecc',
			curve: 'curve25519',
			userIDs: [{ name: 'Test User', email: 'test@example.com' }],
			passphrase
		});

		const privateKeyObj = await openpgp.readKey({ armoredKey: privateKey });
		const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });

		// 2. Verify decryptPrivateKey throws with wrong passphrase
		await expect(decryptPrivateKey(privateKeyObj, 'wrong-passphrase')).rejects.toThrow();

		// 3. Verify decryptPrivateKey returns key object with correct passphrase
		const correctPassResult = await decryptPrivateKey(privateKeyObj, passphrase);
		expect(correctPassResult).toBeTruthy();
		expect(correctPassResult?.isPrivate()).toBe(true);

		// 4. Verify decryptMessage works with the unlocked key
		const messageText = 'Hello, World!';
		const encrypted = await encryptMessage(publicKeyObj, messageText);

		const decrypted = await decryptMessage(correctPassResult!, encrypted);
		expect(decrypted).toBe(messageText);
	});
});
