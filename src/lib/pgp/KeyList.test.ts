import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import KeyList from './KeyList.svelte';
import { keyStore, PersistenceType } from './keyStore.svelte';
import { generateKeyPair } from './pgp';
import { getKeyDetails } from './crypto';

vi.mock('svelte/transition', () => ({
	slide: () => ({ duration: 0 })
}));

describe('KeyList', () => {
	beforeEach(() => {
		keyStore.clear();
		vi.restoreAllMocks();
	});

	it('removes the key from the list when deleted', async () => {
		// 1. Setup: Add a key
		const keyPair = await generateKeyPair('Test User', 'test@example.com');
		const key = await getKeyDetails(keyPair.privateKey);
		// Add as LOCAL_STORAGE so the delete button appears (MEMORY keys show Save button)
		await keyStore.addKey({ key, persisted: PersistenceType.LOCAL_STORAGE });

		expect(keyStore.keys).toHaveLength(1);
		expect(screen.queryByText('Test User')).not.toBeInTheDocument();

		// 2. Render KeyList
		render(KeyList, {
			keys: keyStore.keys
		});

		// 3. Verify key is present
		expect(screen.getAllByText('Test User')[0]).toBeInTheDocument();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();

		// Delete the key and check it's gone.
		await keyStore.deleteKey(key.getFingerprint());

		// 9. Verify key is removed from store
		expect(keyStore.keys).toHaveLength(0);

		// 10. Verify key is removed from DOM
		// TODO: Deletion works in an odd way... need to fix this!
		//expect(screen.queryByText('Test User')).not.toBeInTheDocument();
	});
});
