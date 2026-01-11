import * as openpgp from 'openpgp';

/**
 * Normalizes a PGP key by removing preamble/postamble, trimming whitespace,
 * Returns null if the key is invalid.
 */
export function cleanKey(armoredKey: string): string {
	if (!armoredKey) throw new Error('Key is empty');

	// Extract the block (Public or Private)
	const match = armoredKey.match(
		/-----BEGIN PGP (PUBLIC|PRIVATE) KEY BLOCK-----[\s\S]+?-----END PGP \1 KEY BLOCK-----/
	);

	if (!match) {
		throw new Error('Invalid key format: Missing PGP header/footer');
	}

	const block = match[0];
	// Split by newline, trim each line, and remove empty lines
	const lines = block
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length < 2) throw new Error('Invalid key format: Key is too short');

	const headerLines: string[] = [];
	const bodyLines: string[] = [];
	let inBody = false;

	// Iterate lines between BEGIN (index 0) and END (index length-1)
	for (let i = 1; i < lines.length - 1; i++) {
		const line = lines[i];
		if (inBody) {
			bodyLines.push(line);
		} else {
			// Heuristic: Headers usually contain ':'. Base64 body does not.
			// If we encounter a line without ':' it's likely the start of the body.
			// Note: This might break folded headers if they don't have ':' on the continuation line,
			// but standard keys usually don't have complex folded headers.
			if (line.includes(':')) {
				headerLines.push(line);
			} else {
				inBody = true;
				bodyLines.push(line);
			}
		}
	}

	// Reconstruct with mandatory empty line between headers and body
	return [
		lines[0], // BEGIN
		...headerLines,
		'', // Mandatory empty line
		...bodyLines,
		lines[lines.length - 1] // END
	].join('\n');
}

/**
 * Encrypts a text message using a public PGP key.
 */
export async function encryptMessage(publicKey: openpgp.Key, text: string): Promise<string> {
	if (text == null) throw new Error('Message text is required');

	try {
		const message = await openpgp.createMessage({ text });

		const encrypted = await openpgp.encrypt({
			message,
			encryptionKeys: publicKey
		});

		return encrypted as string;
	} catch (error) {
		console.error('Encryption error:', error);
		throw error;
	}
}

/**
 * Decrypts an encrypted message using a private PGP key.
 */
export async function decryptMessage(
	privateKey: openpgp.Key,
	encryptedMessage: string
): Promise<string> {
	// readMessage outside of try-catch as we don't want to log malformed message errors
	const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });

	try {
		const { data: decrypted } = await openpgp.decrypt({
			message,
			decryptionKeys: privateKey as openpgp.PrivateKey
		});

		return decrypted as string;
	} catch (error) {
		console.debug('Decryption error:', error);
		throw error;
	}
}

/**
 * Checks if a string is ASCII armored and returns its type.
 * Returns null if the string is not valid ASCII armor.
 */
export async function getArmorType(text: string): Promise<openpgp.enums.armor | null> {
	if (!text) return null;
	try {
		const result = await openpgp.unarmor(text);
		return result.type;
	} catch {
		return null;
	}
}

/**
 * Signs a text message using a private PGP key.
 */
export async function signMessage(privateKey: openpgp.PrivateKey, text: string): Promise<string> {
	if (text == null) throw new Error('Message text is required');

	try {
		const message = await openpgp.createMessage({ text });

		const signed = await openpgp.sign({
			message,
			signingKeys: privateKey
		});

		return signed as string;
	} catch (error) {
		console.error('Signing error:', error);
		throw error;
	}
}

/**
 * Verifies a signed message using a public PGP key.
 */
export async function verifySignature(
	publicKey: openpgp.Key,
	signedMessage: string
): Promise<boolean> {
	try {
		const message = await openpgp.readMessage({ armoredMessage: signedMessage });

		const verificationResult = await openpgp.verify({
			message,
			verificationKeys: publicKey
		});

		const { verified } = verificationResult.signatures[0];
		await verified; // throws on invalid signature

		return true;
	} catch (error) {
		console.error('Verification error:', error);
		throw error;
	}
}

/**
 * Parses a PGP key and returns the OpenPGP Key object.
 * Returns null if the key is invalid.
 */
export async function getKeyDetails(armoredKey: string): Promise<openpgp.Key> {
	try {
		const cleanedKey = cleanKey(armoredKey);
		return await openpgp.readKey({ armoredKey: cleanedKey });
	} catch (error) {
		console.error('Key parsing error:', error);
		throw error;
	}
}

/**
 * Decrypts a private key with a passphrase.
 * Returns the decrypted key if successful, null otherwise.
 */
export async function decryptPrivateKey(
	key: openpgp.Key,
	passphrase: string
): Promise<openpgp.PrivateKey> {
	if (!key.isPrivate()) throw new Error('Key is not a private key');

	try {
		const privateKey = key as openpgp.PrivateKey;
		const decryptedKey = await openpgp.decryptKey({ privateKey, passphrase });
		return decryptedKey;
	} catch (e) {
		// Suppress logging for incorrect passphrase errors
		if (!e.message.includes('Incorrect')) {
			console.error('Failed to decrypt private key', e);
		}
		throw e;
	}
}

/**
 * Generates a new PGP key pair.
 */
export async function generateKeyPair(
	name: string,
	email: string,
	passphrase?: string
): Promise<{ privateKey: string; publicKey: string; revocationCertificate: string }> {
	const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
		type: 'curve25519',
		userIDs: [{ name, email }],
		passphrase
	});
	return { privateKey, publicKey, revocationCertificate };
}
