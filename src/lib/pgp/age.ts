import * as age from 'age-encryption';
import { AGEKeyFacade } from './crypto';

/**
 * Checks if a string looks like an AGE key (public or private)
 */
export function isAGEKeyString(text: string): boolean {
	const trimmed = text.trim();
	// age1... is public key
	// AGE-SECRET-KEY-1... is private key
	return trimmed.startsWith('age1') || trimmed.startsWith('AGE-SECRET-KEY-1');
}

/**
 * Cleaning a key for AGE is just trimming it.
 */
export function cleanKey(text: string): string {
	return text.trim();
}

/**
 * Parse an AGE key string into an AGEKeyFacade
 */
export async function getKeyDetails(text: string): Promise<AGEKeyFacade> {
	const trimmed = text.trim();
	if (trimmed.startsWith('AGE-SECRET-KEY-1')) {
		// Private key
		// Verify it's valid by trying to get the recipient
		try {
			const recipient = await age.identityToRecipient(trimmed);
			return new AGEKeyFacade(trimmed, recipient);
		} catch (e) {
			throw new Error('Invalid AGE private key: ' + (e as Error).message);
		}
	} else if (trimmed.startsWith('age1')) {
		// Public key
		// No easy way to validate format other than regex or trying to use it.
		// age-encryption doesn't seem to have a standalone validator exposed simply.
		return new AGEKeyFacade(trimmed);
	}
	throw new Error('Invalid AGE key format');
}

/**
 * Generate a new AGE key pair
 */
export async function generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
	// name and email are ignored for AGE keys as they don't contain metadata
	const identity = await age.generateIdentity();
	const recipient = await age.identityToRecipient(identity);
	return { privateKey: identity, publicKey: recipient };
}

/**
 * Encrypt a message using an AGE key
 */
export async function encryptMessage(key: AGEKeyFacade, text: string): Promise<string> {
	const encrypter = new age.Encrypter();

	// Use the public key (recipient string)
	// If the key is private, .toPublic() gets the facade with only public part, .getArmor() gets the string
	const publicKey = key.toPublic().getArmor();

	try {
		encrypter.addRecipient(publicKey);
		const ciphertext = await encrypter.encrypt(text);
		return age.armor.encode(ciphertext);
	} catch (e) {
		console.error('AGE Encryption error:', e);
		throw e;
	}
}

/**
 * Decrypt a message using an AGE key
 */
export async function decryptMessage(key: AGEKeyFacade, armoredMessage: string): Promise<string> {
	if (!key.isPrivate()) {
		throw new Error('Cannot decrypt with a public key');
	}

	const decrypter = new age.Decrypter();
	// key.getArmor() returns the secret key string for private keys
	decrypter.addIdentity(key.getArmor());

	let ciphertext: Uint8Array;
	try {
		ciphertext = age.armor.decode(armoredMessage);
	} catch {
		// Only throw if it looks like an AGE message but failed to decode
		// If it's randomly invalid text, maybe return a nice error.
		throw new Error('Invalid armored AGE message');
	}

	try {
		return await decrypter.decrypt(ciphertext, 'text');
	} catch (e) {
		console.debug('AGE Decryption error:', e);
		throw e;
	}
}
