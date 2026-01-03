import * as openpgp from 'openpgp';

/**
 * Encrypts a text message using a public PGP key.
 */
export async function encryptMessage(publicKeyArmored: string, text: string): Promise<string> {
  if (!publicKeyArmored || !text) {
    return '';
  }

  try {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const message = await openpgp.createMessage({ text });
    
    const encrypted = await openpgp.encrypt({
      message,
      encryptionKeys: publicKey
    });
    
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return `Error: ${(error as Error).message}`;
  }
}

/**
 * Decrypts an encrypted message using a private PGP key.
 */
export async function decryptMessage(privateKeyArmored: string, encryptedMessage: string): Promise<string> {
  if (!privateKeyArmored || !encryptedMessage) {
    return '';
  }

  try {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });
    
    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey
    });
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return `Error: ${(error as Error).message}`;
  }
}

/**
 * Signs a text message using a private PGP key.
 */
export async function signMessage(privateKeyArmored: string, text: string): Promise<string> {
  if (!privateKeyArmored || !text) {
    return '';
  }

  try {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const message = await openpgp.createMessage({ text });
    
    const signed = await openpgp.sign({
      message,
      signingKeys: privateKey
    });
    
    return signed;
  } catch (error) {
    console.error("Signing error:", error);
    return `Error: ${error.message}`;
  }
}

/**
 * Verifies a signed message using a public PGP key.
 */
export async function verifySignature(publicKeyArmored: string, signedMessage: string): Promise<boolean> {
  if (!publicKeyArmored || !signedMessage) {
    return false;
  }

  try {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const message = await openpgp.readMessage({ armoredMessage: signedMessage });
    
    const verificationResult = await openpgp.verify({
      message,
      verificationKeys: publicKey
    });
    
    const { verified } = verificationResult.signatures[0];
    await verified; // throws on invalid signature
    
    return true;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}
