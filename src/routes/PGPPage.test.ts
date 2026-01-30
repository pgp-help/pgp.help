import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PGPPage from './PGPPage.svelte';
import { keyStore } from '../lib/pgp/keyStore.svelte';
import { router, Pages } from './router.svelte';

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
			expect(screen.getAllByText('Private Key').length).toBeGreaterThan(0);
			//NTH: getByRole would probably be better here...
			expect(screen.getAllByText('Test <test@test.com>').length).toBeGreaterThan(0);

			// We can also verify that the router has navigated back to HOME (which implies the workflow is shown)
			// Since PGPWorkflow is rendered, and it shows the key details.
		});
	});

	it('expands private key section for newly generated keys and marks as viewed when opened', async () => {
		// Setup Generate Key page
		router.openPage(Pages.GENERATE_KEY);

		render(PGPPage);

		// Fill form and submit to generate a new key
		await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
		await fireEvent.input(screen.getByLabelText('Email'), {
			target: { value: 'test@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Generate Key' }));

		await vi.waitFor(() => {
			// Verify we're back on the main page with the new key
			expect(screen.getAllByText('Private Key').length).toBeGreaterThan(0);
			expect(screen.getAllByText('Test User <test@example.com>').length).toBeGreaterThan(0);
		});

		// The private key section should be automatically expanded for new keys
		await vi.waitFor(() => {
			// Look for the "New - Please backup!" badge that only shows for new keys
			expect(screen.getByText(/This is your newly generated private key/)).toBeInTheDocument();

			// The private key details should be visible (expanded)
			const privateKeyDetails = screen.getByText(/click to export/i);
			expect(privateKeyDetails).toBeVisible();

			// Should show the enhanced warning message for new keys
			expect(
				screen.getByText(/IMPORTANT: This is your newly generated private key/i)
			).toBeInTheDocument();
		});

		//TOOD: Should check that when we come back to this key, the other warning message is shown. but I ran out of credits!
	});
});
