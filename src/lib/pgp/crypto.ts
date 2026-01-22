/**
 * Common crypto types and interfaces for PGP and AGE encryption.
 * This provides a facade pattern to allow the UI to work with both
 * PGP and AGE keys seamlessly.
 */

import type { Key as OpenPGPKey } from 'openpgp';

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
	getID(): string;

	/** Get the full fingerprint/identifier */
	getFingerprint(): string;

	/** Get the armored string representation of this key */
	getArmor(): string;

	/** Get user identities associated with this key */
	getUserIDs(): string[];

	/** Check if the key is encrypted/locked */
	isEncrypted(): boolean;

	/** For private keys that are encrypted, unlock them */
	unlock?(passphrase: string): Promise<CryptoKey>;

	/** Some keys (like PGP) are decrypted in place, others might return a new key */
	isDecrypted?(): boolean;

	/** Get the creation time of the key */
	getCreationTime(): Date;

	/** Check if this key is expired */
	isExpired(): Promise<boolean>;

	/** Get expiration time, or null if never expires */
	getExpirationTime(): Promise<Date | null>;

	/** Convert to public key (returns same object if already public) */
	toPublic(): CryptoKey;
}

/**
 * PGP implementation of CryptoKey facade
 */
export class PGPKeyFacade implements CryptoKey {
	readonly type = KeyType.PGP;

	constructor(private key: OpenPGPKey) {}

	isPrivate(): boolean {
		return this.key.isPrivate();
	}

	getID(): string {
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

	isEncrypted(): boolean {
		if (!this.key.isPrivate()) return false;
		const privateKey = this.key as OpenPGPKey & { isDecrypted?: () => boolean };
		return privateKey.isDecrypted ? !privateKey.isDecrypted() : false;
	}

	isDecrypted(): boolean {
		const privateKey = this.key as OpenPGPKey & { isDecrypted?: () => boolean };
		return privateKey.isDecrypted ? privateKey.isDecrypted() : true;
	}

	getCreationTime(): Date {
		return this.key.getCreationTime() as Date;
	}

	async isExpired(): Promise<boolean> {
		const exp = await this.getExpirationTime();
		return exp !== null && exp < new Date();
	}

	async getExpirationTime(): Promise<Date | null> {
		const exp = await this.key.getExpirationTime();
		return exp as Date | null;
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

	getID(): string {
		const pub = this.publicKeyString || this.keyString;
		if (pub.startsWith('age1')) {
			return pub.substring(0, 16) + '...';
		}
		return 'AGE Key';
	}

	getFingerprint(): string {
		return this.publicKeyString || this.keyString;
	}

	getArmor(): string {
		return this.keyString;
	}

	getUserIDs(): string[] {
		return this.isPrivate() ? ['AGE Private Key'] : ['AGE Public Key'];
	}

	isEncrypted(): boolean {
		return false;
	}

	isDecrypted(): boolean {
		return true;
	}

	getCreationTime(): Date {
		return new Date();
	}

	async isExpired(): Promise<boolean> {
		return false;
	}

	async getExpirationTime(): Promise<Date | null> {
		return null;
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
 * Check if a CryptoKey is an AGE key
 */
export function isAGEKey(key: CryptoKey): key is AGEKeyFacade {
	return key.type === KeyType.AGE;
}
