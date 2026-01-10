import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import KeySidebar from './KeySidebar.svelte';
import { keyStore } from './keyStore.svelte';
import { generateKeyPair, getKeyDetails } from './pgp';

vi.mock('svelte/transition', () => ({
	slide: () => ({ duration: 0 })
}));

describe('KeySidebar', () => {
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

		// 2. Render Sidebar
		render(KeySidebar);

		// 3. Verify key is present
		expect(screen.getByText('Test User')).toBeInTheDocument();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();

		// 4. Mock confirm to return true
		// Ensure window.confirm exists in the test environment
		if (!window.confirm) {
			window.confirm = vi.fn();
		}
		const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

		// 5. Click delete button
		// The delete button is inside KeyListItem, which is inside KeySidebar.
		// It has aria-label="Delete key"
		const deleteBtn = screen.getByLabelText('Delete key');
		await fireEvent.click(deleteBtn);

		// 6. Verify confirm was called
		expect(confirmSpy).toHaveBeenCalled();

		// 7. Verify key is removed from store
		expect(keyStore.keys).toHaveLength(0);

		// 8. Verify key is removed from DOM
		await waitFor(() => {
			expect(screen.queryByText('Test User')).not.toBeInTheDocument();
		});
	});
});
