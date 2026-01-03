import * as openpgp from 'openpgp';

/**
 * Encrypts a text message using a public PGP key.
 * @param {string} publicKeyArmored - The ASCII armored public key.
 * @param {string} text - The message text to encrypt.
 * @returns {Promise<string>} - The encrypted ASCII armored message.
 */
export async function encryptMessage(publicKeyArmored, text) {
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
    return `Error: ${error.message}`;
  }
}
