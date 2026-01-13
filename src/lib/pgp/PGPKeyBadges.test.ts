import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PGPKeyBadges from './PGPKeyBadges.svelte';
import { generateKeyPair, getKeyDetails } from './pgp';
import type { Key } from 'openpgp';
import { PersistenceType } from './keyStore.svelte';

describe('PGPKeyBadges', () => {
	let privateKey: Key;
	let publicKey: Key;

	beforeEach(async () => {
		const keyPair = await generateKeyPair('Test User', 'test@example.com', 'password');
		privateKey = await getKeyDetails(keyPair.privateKey);
		publicKey = await getKeyDetails(keyPair.publicKey);
	});

	it('renders Private badge for private key', () => {
		render(PGPKeyBadges, {
			keyWrapper: { key: privateKey, persisted: PersistenceType.LOCAL_STORAGE }
		});
		expect(screen.getByText('Private')).toBeInTheDocument();
	});

	it('renders Public badge for public key', () => {
		render(PGPKeyBadges, {
			keyWrapper: { key: publicKey, persisted: PersistenceType.LOCAL_STORAGE }
		});
		expect(screen.getByText('Public')).toBeInTheDocument();
	});

	it('renders Unsaved badge when persisted is MEMORY', () => {
		render(PGPKeyBadges, { keyWrapper: { key: publicKey, persisted: PersistenceType.MEMORY } });
		expect(screen.getByText('Unsaved')).toBeInTheDocument();
	});

	it('does not render Unsaved badge when persisted is ASSET', () => {
		render(PGPKeyBadges, { keyWrapper: { key: publicKey, persisted: PersistenceType.ASSET } });
		expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
	});

	it('does not render Unsaved badge when persisted is LOCAL_STORAGE', () => {
		render(PGPKeyBadges, {
			keyWrapper: { key: publicKey, persisted: PersistenceType.LOCAL_STORAGE }
		});
		expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
	});

	it('renders Locked badge for locked private key', () => {
		// Private key is locked by default when parsed from armor
		render(PGPKeyBadges, {
			keyWrapper: { key: privateKey, persisted: PersistenceType.LOCAL_STORAGE }
		});
		// We removed "Locked" badge, so it should NOT be there.
		// Wait, the requirement was "Remove the 'Locked' badge".
		expect(screen.queryByText('Locked')).not.toBeInTheDocument();
	});

	it('renders No Password badge for unlocked private key without onLock callback', async () => {
		const { decryptPrivateKey } = await import('./pgp');
		const decrypted = await decryptPrivateKey(privateKey, 'password');

		render(PGPKeyBadges, {
			keyWrapper: {
				key: decrypted,
				persisted: PersistenceType.LOCAL_STORAGE,
				hasNoPassword: true
			}
		}); // No onLock prop
		expect(screen.getByText('No Password')).toBeInTheDocument();
	});
});
