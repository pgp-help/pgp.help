/**
 * Cipher facade - routes encryption/decryption operations to the appropriate
 * implementation (PGP or AGE) based on the key type
 */

import type { CryptoKey } from './crypto';
import { KeyType, PGPKeyFacade } from './crypto';

// Import PGP functions
import {
	encryptMessage as pgpEncrypt,
	decryptMessage as pgpDecrypt,
	signMessage as pgpSign,
	verifySignature as pgpVerify
} from './pgp';

// Import AGE functions
import { encryptMessage as ageEncrypt, decryptMessage as ageDecrypt } from './age';

// Re-export this for generic use if needed
export { parseKey } from './keyStore.svelte';

/**
 * Encrypt a text message using the appropriate encryption method
 * based on the key type
 */
export async function encryptMessage(key: CryptoKey, text: string): Promise<string> {
	if (key.type === KeyType.AGE) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ageEncrypt(key as any, text);
	} else {
		// PGP uses openpgp.Key type, but we're wrapping it
		const { PGPKeyFacade } = await import('./crypto');
		if (key instanceof PGPKeyFacade) {
			const openpgpKey = key.getOpenPGPKey();
			return pgpEncrypt(openpgpKey, text);
		}
		throw new Error('Unknown key type for encryption');
	}
}

/**
 * Decrypt an encrypted message using the appropriate decryption method
 * based on the key type
 */
export async function decryptMessage(key: CryptoKey, encryptedMessage: string): Promise<string> {
	if (key.type === KeyType.AGE) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ageDecrypt(key as any, encryptedMessage);
	} else {
		const { PGPKeyFacade } = await import('./crypto');
		if (key instanceof PGPKeyFacade) {
			const openpgpKey = key.getOpenPGPKey();
			return pgpDecrypt(openpgpKey, encryptedMessage);
		}
		throw new Error('Unknown key type for decryption');
	}
}

/**
 * Sign a text message using the appropriate signing method
 * based on the key type
 */
export async function signMessage(key: CryptoKey, text: string): Promise<string> {
	if (key.type === KeyType.AGE) {
		throw new Error('Signing is not supported by AGE encryption');
	} else {
		const { PGPKeyFacade } = await import('./crypto');
		if (key instanceof PGPKeyFacade) {
			// type assertion needed because openpgp.PrivateKey is a subtype of openpgp.Key
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const openpgpKey = key.getOpenPGPKey() as any;
			return pgpSign(openpgpKey, text);
		}
		throw new Error('Unknown key type for signing');
	}
}

/**
 * Verify a signed message using the appropriate verification method
 * based on the key type
 */
export async function verifySignature(key: CryptoKey, signedMessage: string): Promise<boolean> {
	if (key.type === KeyType.AGE) {
		throw new Error('Signing is not supported by AGE encryption');
	} else {
		if (key instanceof PGPKeyFacade) {
			const openpgpKey = key.getOpenPGPKey();
			return pgpVerify(openpgpKey, signedMessage);
		}
		throw new Error('Unknown key type for verification');
	}
}

/**
 * Check if a string looks like an AGE encrypted message
 * AGE messages are base64 encoded (from our implementation)
 */
export function isAGEEncryptedMessage(text: string): boolean {
	const trimmed = text.trim();
	// Check if it's valid base64
	try {
		const decoded = atob(trimmed);
		// AGE encrypted messages are typically longer than this
		return decoded.length > 50;
	} catch {
		return false;
	}
}
