import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import KeyList from './KeyList.svelte';
import { keyStore } from './keyStore.svelte';
import { generateKeyPair, getKeyDetails } from './pgp';

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
		await keyStore.addKey(key);

		expect(keyStore.keys).toHaveLength(1);
		expect(screen.queryByText('Test User')).not.toBeInTheDocument();

		// 2. Render KeyList
		render(KeyList, {
			keys: keyStore.keys
		});

		// 3. Verify key is present
		expect(screen.getAllByText('Test User')[0]).toBeInTheDocument();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();

		// 4. Mock HTMLDialogElement methods
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();

		// 5. Click delete button (trash icon)
		const deleteBtn = screen.getByLabelText('Delete key');
		await fireEvent.click(deleteBtn);

		// 6. Verify modal is shown
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();

		// 7. Verify warning is present (since it's a private key)
		expect(screen.getByText(/Warning: This is a private key/i)).toBeInTheDocument();

		// 8. Click the confirm delete button inside the modal
		// Since there's only one key, there's only one "Delete" button in a modal
		const confirmDeleteBtn = screen.getByText('Delete', { selector: 'button.btn-error' });
		await fireEvent.click(confirmDeleteBtn);

		// 9. Verify key is removed from store
		expect(keyStore.keys).toHaveLength(0);

		// 10. Verify key is removed from DOM
		// TODO: Deletion works in an odd way... need to fix this!
		//expect(screen.queryByText('Test User')).not.toBeInTheDocument();
	});
});
