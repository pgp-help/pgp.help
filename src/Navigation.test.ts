import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from './App.svelte';
import { keyStore } from './lib/pgp/keyStore.svelte';
import { generateKeyPair } from './lib/pgp/pgp';
import { router } from './routes/router.svelte';

describe('Navigation', () => {
	let key1: { privateKey: string; name: string };
	let key2: { privateKey: string; name: string };

	beforeAll(async () => {
		const k1 = await generateKeyPair('User One', 'user1@example.com');
		key1 = { privateKey: k1.privateKey, name: 'User One' };

		const k2 = await generateKeyPair('User Two', 'user2@example.com');
		key2 = { privateKey: k2.privateKey, name: 'User Two' };
	});

	beforeEach(async () => {
		await keyStore.clear();
		window.history.replaceState({}, '', '/');
		router.openHome();
	});

	it('navigates between keys and new key mode', async () => {
		const user = userEvent.setup();
		render(App);

		// 1. Enter private key 1
		// Initially the form asks for "Import Key"
		const keyTextarea = screen.getByLabelText(/^Import Key$/i);
		await fireEvent.input(keyTextarea, { target: { value: key1.privateKey } });

		// Verify it appears in sidebar
		// Sidebar is in <aside> with aria-label="Sidebar"
		const sidebar = screen.getByRole('complementary', { name: /Sidebar/i });
		await within(sidebar).findByTitle('User One');

		// Verify main view shows it (card view)
		const mainArea = screen.getByRole('main', { name: 'PGP Workflow' });
		await within(mainArea).findByRole('heading', { name: /User One/ });

		// 2. Press New Key
		const newKeyButton = within(sidebar).getByRole('button', { name: /Import Key/i });
		await user.click(newKeyButton);

		// Verify form is cleared.
		// The main view should revert to textarea.
		const keyTextarea2 = await screen.findByLabelText(/^Import Key$/i);
		expect(keyTextarea2).toBeInTheDocument();
		expect((keyTextarea2 as HTMLTextAreaElement).value).toBe('');

		// 3. Enter private key 2
		await fireEvent.input(keyTextarea2, { target: { value: key2.privateKey } });

		// Verify it appears in sidebar
		await within(sidebar).findByTitle('User Two');

		// Verify both are present in sidebar
		expect(within(sidebar).getByTitle('User One')).toBeInTheDocument();
		expect(within(sidebar).getByTitle('User Two')).toBeInTheDocument();

		// 4. Select previous private key
		await user.click(within(sidebar).getByTitle('User One'));

		// Verify App navigates to it
		// Main view should show User One
		await within(mainArea).findByRole('heading', { name: /User One/ });

		// And NOT User Two (in main view)
		// Note: queryByText might find it in the sidebar if we don't scope to main
		expect(within(mainArea).queryByText(/User Two/)).not.toBeInTheDocument();
	});

	it('handles ?key=... URL parameter', async () => {
		// Simulate a user browsing to a URL with `?key=` parameter
		router.openKeyString(key1.privateKey);

		render(App);

		// Verify it gets added to the store and sidebar automatically
		const sidebar = screen.getByRole('complementary', { name: /Sidebar/i });
		await within(sidebar).findByText('User One', {}, { timeout: 5000 });

		const mainArea = screen.getByRole('main', { name: 'PGP Workflow' });
		await within(mainArea).findByRole('heading', { name: /User One/ });

		// Verify URL is updated to use path-based fingerprint instead of raw key
		await waitFor(() => {
			const currentUrl = new URL(window.location.href);
			expect(currentUrl.searchParams.has('key')).toBe(false);
			// Fingerprint should now be in the path, not query params
			expect(currentUrl.pathname).toBe('/');
		});
	});
});
