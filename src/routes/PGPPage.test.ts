import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PGPPage from './PGPPage.svelte';
import { keyStore, PersistenceType } from '../lib/pgp/keyStore.svelte.ts';
import { router, Pages } from './router.svelte';
import * as pgp from '../lib/pgp/pgp';

describe('PGPPage', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await keyStore.clear();
		keyStore.shouldPersistByDefault = false;
	});

	it('selects the new key after generation', async () => {
		// Setup Generate Key page
		router.openPage(Pages.GENERATE_KEY);

		render(PGPPage);
		// Fill form and submit
		await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Test' } });
		await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Generate Key' }));

		// Wait for async operations
		await vi.waitFor(() => {
			// PGPPage should show "Private Key", and the newly generated key: "Test <test@test.com>"
			expect(screen.getByText('Private Key')).toBeInTheDocument();
			//NTH: getByRole would probably be better here...
			expect(screen.getAllByText('Test <test@test.com>').length).toBeGreaterThan(0);

			// We can also verify that the router has navigated back to HOME (which implies the workflow is shown)
			// Since PGPWorkflow is rendered, and it shows the key details.
		});
	});

	it('shows clear data dialog when clicking Clear Saved Data button', async () => {
		// Setup
		const pk = await pgp.generateKeyPair('test', 'test@test', '');
		const key = await pgp.getKeyDetails(pk.privateKey);
		keyStore.keys = [
			{
				persisted: PersistenceType.LOCAL_STORAGE,
				key: key
			}
		];

		keyStore.shouldPersistByDefault = true;

		// Mock HTMLDialogElement
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();

		render(PGPPage);

		// Initially:
		// Persist New Keys slider should be visible, and on (because we set it to true).
		const toggle = screen.getByLabelText('Persist new keys') as HTMLInputElement;
		expect(toggle).toBeVisible();
		expect(toggle.checked).toBe(true);

		// Clear data should not be visible (because persist default is true).
		expect(screen.queryByText('Clear Saved Data')).not.toBeInTheDocument();

		// Toggle the slider to off
		await fireEvent.click(toggle);
		expect(toggle.checked).toBe(false);

		// Clear data should be visible (because we have a local storage key and persist default is false)
		expect(screen.getByText('Clear Saved Data')).toBeVisible();

		// Toggle the slider back on
		await fireEvent.click(toggle);
		expect(screen.queryByText('Clear Saved Data')).not.toBeInTheDocument();

		// Toggle the slider back off
		await fireEvent.click(toggle);

		// Press Clear data
		await fireEvent.click(screen.getByText('Clear Saved Data'));

		// Check if dialog showModal was called
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();

		// Simulate clearing data
		const clearButton = screen.getByText('Clear Data'); // The one in the modal
		await fireEvent.click(clearButton);

		// Keystore should be empty (except for the built-in keys, but we mocked keys array so it should be empty)
		expect(keyStore.keys.length).toBe(0);

		// Clear data button should not be visible anymore
		expect(screen.queryByText('Clear Saved Data')).not.toBeInTheDocument();
	});
});
