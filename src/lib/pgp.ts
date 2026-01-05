import * as openpgp from 'openpgp';

/**
 * Normalizes a PGP key by removing preamble/postamble, trimming whitespace,
 * Returns null if the key is invalid.
 */
export function cleanKey(armoredKey: string): string | null {
	if (!armoredKey) return null;

	// Extract the block (Public or Private)
	const match = armoredKey.match(
		/-----BEGIN PGP (PUBLIC|PRIVATE) KEY BLOCK-----[\s\S]+?-----END PGP \1 KEY BLOCK-----/
	);

	if (!match) {
		return null;
	}

	const block = match[0];
	// Split by newline, trim each line, and remove empty lines
	const lines = block
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length < 2) return null;

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
	if (!publicKey || !text) {
		return '';
	}

	try {
		const message = await openpgp.createMessage({ text });

		const encrypted = await openpgp.encrypt({
			message,
			encryptionKeys: publicKey
		});

		return encrypted as string;
	} catch (error) {
		console.error('Encryption error:', error);
		return `Error: ${(error as Error).message}`;
	}
}

/**
 * Decrypts an encrypted message using a private PGP key.
 */
export async function decryptMessage(
	privateKey: openpgp.PrivateKey,
	encryptedMessage: string
): Promise<string> {
	if (!privateKey || !encryptedMessage) {
		return '';
	}

	try {
		const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });

		const { data: decrypted } = await openpgp.decrypt({
			message,
			decryptionKeys: privateKey
		});

		return decrypted as string;
	} catch (error) {
		console.error('Decryption error:', error);
		return `Error: ${(error as Error).message}`;
	}
}

/**
 * Signs a text message using a private PGP key.
 */
export async function signMessage(privateKey: openpgp.PrivateKey, text: string): Promise<string> {
	if (!privateKey || !text) {
		return '';
	}

	try {
		const message = await openpgp.createMessage({ text });

		const signed = await openpgp.sign({
			message,
			signingKeys: privateKey
		});

		return signed as string;
	} catch (error) {
		console.error('Signing error:', error);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return `Error: ${(error as any).message}`;
	}
}

/**
 * Verifies a signed message using a public PGP key.
 */
export async function verifySignature(
	publicKey: openpgp.Key,
	signedMessage: string
): Promise<boolean> {
	if (!publicKey || !signedMessage) {
		return false;
	}

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
		return false;
	}
}

/**
 * Parses a PGP key and returns the OpenPGP Key object.
 * Returns null if the key is invalid.
 */
export async function getKeyDetails(armoredKey: string): Promise<openpgp.Key | null> {
	if (!armoredKey) return null;

	try {
		const cleanedKey = cleanKey(armoredKey);
		if (!cleanedKey) return null;
		return await openpgp.readKey({ armoredKey: cleanedKey });
	} catch {
		// Key parsing failed
		return null;
	}
}
