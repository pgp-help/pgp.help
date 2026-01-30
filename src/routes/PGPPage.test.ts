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
});
