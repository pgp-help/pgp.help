/**
 * Unified crypto layer - provides facade pattern for PGP and AGE encryption.
 * This allows the UI to work with both key types seamlessly and provides
 * encryption/decryption operations.
 */

import type { Key as OpenPGPKey } from 'openpgp';

// Import PGP functions
import {
	encryptMessage as pgpEncrypt,
	decryptMessage as pgpDecrypt,
	signMessage as pgpSign,
	verifySignature as pgpVerify,
	getKeyDetails as pgpGetKeyDetails
} from './pgp';

// Import AGE functions
import {
	encryptMessage as ageEncrypt,
	decryptMessage as ageDecrypt,
	getKeyDetails as ageGetKeyDetails,
	isAGEKeyString
} from './age';

/**
 * The type of encryption key
 */
export enum KeyType {
	PGP = 'pgp',
	AGE = 'age'
}

/**
 * Common interface for cryptographic keys (PGP and AGE)
 * This abstraction allows the UI to work with both key types transparently
 */
export interface CryptoKey {
	/** The type of the key (PGP or AGE) */
	readonly type: KeyType;

	/** Check if this is a private key */
	isPrivate(): boolean;

	/** Get a unique identifier for this key */
	getId(): string;

	/** Get the full fingerprint/identifier */
	getFingerprint(): string;

	/** Get the armored string representation of this key */
	getArmor(): string;

	/** Get user identities associated with this key */
	getUserIDs(): string[];

	/** For private keys that are encrypted, unlock them */
	unlock?(passphrase: string): Promise<CryptoKey>;

	/** Some keys (like PGP) are decrypted in place, others might return a new key */
	isDecrypted?(): boolean;

	/** Convert to public key (returns same object if already public) */
	toPublic(): CryptoKey;
}

/**
 * PGP implementation of CryptoKey facade
 */
export class PGPKeyFacade implements CryptoKey {
	readonly type = KeyType.PGP;

	constructor(private key: OpenPGPKey) {
		if (!key) {
			throw new Error('PGPKeyFacade requires a valid OpenPGP key');
		}
	}

	isPrivate(): boolean {
		return this.key.isPrivate();
	}

	getId(): string {
		return this.key.getKeyID().toHex();
	}

	getFingerprint(): string {
		return this.key.getFingerprint();
	}

	getArmor(): string {
		return this.key.armor();
	}

	getUserIDs(): string[] {
		return this.key.getUserIDs();
	}

	isDecrypted(): boolean {
		const privateKey = this.key as OpenPGPKey & { isDecrypted?: () => boolean };
		return privateKey.isDecrypted ? privateKey.isDecrypted() : true;
	}

	toPublic(): CryptoKey {
		if (!this.key.isPrivate()) {
			return this;
		}
		return new PGPKeyFacade(this.key.toPublic());
	}

	/** Get the underlying OpenPGP key object */
	getOpenPGPKey(): OpenPGPKey {
		return this.key;
	}
}

/**
 * AGE implementation of CryptoKey facade
 */
export class AGEKeyFacade implements CryptoKey {
	readonly type = KeyType.AGE;

	constructor(
		private keyString: string,
		private publicKeyString?: string
	) {}

	isPrivate(): boolean {
		return this.keyString.startsWith('AGE-SECRET-KEY-');
	}

	getId(): string {
		const pub = this.publicKeyString || this.keyString;
		if (pub.startsWith('age1')) {
			return pub.substring(0, 16) + '...';
		}
		return 'AGE Key';
	}

	getFingerprint(): string {
		// Always return the public key as fingerprint
		return this.publicKeyString || this.keyString;
	}

	getArmor(): string {
		return this.keyString;
	}

	getUserIDs(): string[] {
		return this.isPrivate() ? ['AGE Private Key'] : ['AGE Public Key'];
	}

	isDecrypted(): boolean {
		return true;
	}

	toPublic(): CryptoKey {
		if (!this.isPrivate()) {
			return this;
		}
		if (!this.publicKeyString) {
			throw new Error('Public key not available');
		}
		return new AGEKeyFacade(this.publicKeyString);
	}

	/** Get the key string */
	getKeyString() {
		return this.keyString;
	}
}

/**
 * Create a CryptoKey facade from an OpenPGP key
 */
export function wrapPGPKey(key: OpenPGPKey): CryptoKey {
	return new PGPKeyFacade(key);
}

/**
 * Check if a CryptoKey is a PGP key
 */
export function isPGPKey(key: CryptoKey): key is PGPKeyFacade {
	return key.type === KeyType.PGP;
}

/**
 * Unified key parsing function that detects the key type and returns a CryptoKey facade
 */
export async function getKeyDetails(keyString: string): Promise<CryptoKey> {
	const trimmed = keyString.trim();

	if (isAGEKeyString(trimmed)) {
		// AGE key - get the raw key data and wrap it
		const ageKeyData = await ageGetKeyDetails(trimmed);
		return new AGEKeyFacade(ageKeyData.keyString, ageKeyData.publicKeyString);
	} else {
		// Assume PGP key
		const openpgpKey = await pgpGetKeyDetails(trimmed);
		return wrapPGPKey(openpgpKey);
	}
}

/**
 * Encrypt a text message using the appropriate encryption method
 * based on the key type
 */
export async function encryptMessage(key: CryptoKey, text: string): Promise<string> {
	if (key.type === KeyType.AGE) {
		if (key instanceof AGEKeyFacade) {
			// Use public key for encryption
			const publicKeyString = key.isPrivate() ? key.getFingerprint() : key.getArmor();
			return ageEncrypt(publicKeyString, text);
		}
		throw new Error('Unknown AGE key type for encryption');
	} else {
		// PGP uses openpgp.Key type, but we're wrapping it
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
		if (key instanceof AGEKeyFacade) {
			if (!key.isPrivate()) {
				throw new Error('Cannot decrypt with a public key');
			}
			// Use private key for decryption
			const privateKeyString = key.getArmor();
			return ageDecrypt(privateKeyString, encryptedMessage);
		}
		throw new Error('Unknown AGE key type for decryption');
	} else {
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

// Re-export this for generic use if needed
export { parseKey } from './keyStore.svelte';
