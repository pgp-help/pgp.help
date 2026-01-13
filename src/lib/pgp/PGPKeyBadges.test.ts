import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PGPKeyBadges from './PGPKeyBadges.svelte';
import { generateKeyPair, getKeyDetails } from './pgp';
import type { Key } from 'openpgp';

describe('PGPKeyBadges', () => {
	let privateKey: Key;
	let publicKey: Key;

	beforeEach(async () => {
		const keyPair = await generateKeyPair('Test User', 'test@example.com', 'password');
		privateKey = await getKeyDetails(keyPair.privateKey);
		publicKey = await getKeyDetails(keyPair.publicKey);
	});

	it('renders Private badge for private key', () => {
		render(PGPKeyBadges, { keyWrapper: { key: privateKey, isPersisted: true } });
		expect(screen.getByText('Private')).toBeInTheDocument();
	});

	it('renders Public badge for public key', () => {
		render(PGPKeyBadges, { keyWrapper: { key: publicKey, isPersisted: true } });
		expect(screen.getByText('Public')).toBeInTheDocument();
	});

	it('renders Unsaved badge when isPersisted is false', () => {
		render(PGPKeyBadges, { keyWrapper: { key: publicKey, isPersisted: false } });
		expect(screen.getByText('Unsaved')).toBeInTheDocument();
	});

	it('does not render Unsaved badge when isPersisted is true', () => {
		render(PGPKeyBadges, { keyWrapper: { key: publicKey, isPersisted: true } });
		expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
	});

	it('renders Locked badge for locked private key', () => {
		// Private key is locked by default when parsed from armor
		render(PGPKeyBadges, { keyWrapper: { key: privateKey, isPersisted: true } });
		// We removed "Locked" badge, so it should NOT be there.
		// Wait, the requirement was "Remove the 'Locked' badge".
		expect(screen.queryByText('Locked')).not.toBeInTheDocument();
	});

	it('renders Unlocked badge for unlocked private key', async () => {
		const { decryptPrivateKey } = await import('./pgp');
		const decrypted = await decryptPrivateKey(privateKey, 'password');

		render(PGPKeyBadges, {
			keyWrapper: { key: decrypted, isPersisted: true }
		});
		expect(screen.getByText('Unlocked')).toBeInTheDocument();
	});

	it('renders No Password badge for unlocked private key without onLock callback', async () => {
		const { decryptPrivateKey } = await import('./pgp');
		const decrypted = await decryptPrivateKey(privateKey, 'password');

		render(PGPKeyBadges, {
			keyWrapper: { key: decrypted, isPersisted: true, hasNoPassword: true }
		}); // No onLock prop
		expect(screen.getByText('No Password')).toBeInTheDocument();
	});
});
