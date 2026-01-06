import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from './App.svelte';
import { keyStore } from './lib/keyStore.svelte';
import { generateKeyPair } from './lib/pgp';
import { router } from './lib/router.svelte';

describe('Navigation', () => {
	let key1: { privateKey: string; name: string };
	let key2: { privateKey: string; name: string };

	beforeAll(async () => {
		const k1 = await generateKeyPair('User One', 'user1@example.com');
		key1 = { privateKey: k1.privateKey, name: 'User One' };

		const k2 = await generateKeyPair('User Two', 'user2@example.com');
		key2 = { privateKey: k2.privateKey, name: 'User Two' };
	});

	beforeEach(() => {
		keyStore.clear();
		window.history.replaceState({}, '', '/');
	});

	it('navigates between keys and new key mode', async () => {
		const user = userEvent.setup();
		render(App);

		// 1. Enter private key 1
		// Initially the form asks for "Private Key" or "Public Key" depending on state,
		// but usually starts with "Public Key" label or generic "PGP Key" if we changed it.
		// In Home.svelte: label={isPrivate ? 'Private Key' : 'Public Key'}
		// Initially isPrivate is false.
		const keyTextarea = screen.getByLabelText(/Public Key/i);
		await fireEvent.input(keyTextarea, { target: { value: key1.privateKey } });

		// Verify it appears in sidebar
		// Sidebar is in <aside> with aria-label="Sidebar"
		const sidebar = screen.getByRole('complementary', { name: /Sidebar/i });
		await within(sidebar).findByText(/User One/);

		// Verify main view shows it (card view)
		const main = screen.getByRole('main');
		await within(main).findByText(/User One/);

		// 2. Press New Key
		const newKeyButton = within(sidebar).getByRole('button', { name: /New Key/i });
		await user.click(newKeyButton);

		// Verify form is cleared.
		// The main view should revert to textarea.
		const keyTextarea2 = await screen.findByLabelText(/Public Key/i);
		expect(keyTextarea2).toBeInTheDocument();
		expect((keyTextarea2 as HTMLTextAreaElement).value).toBe('');

		// 3. Enter private key 2
		await fireEvent.input(keyTextarea2, { target: { value: key2.privateKey } });

		// Verify it appears in sidebar
		await within(sidebar).findByText(/User Two/);

		// Verify both are present in sidebar
		expect(within(sidebar).getByText(/User One/)).toBeInTheDocument();
		expect(within(sidebar).getByText(/User Two/)).toBeInTheDocument();

		// 4. Select previous private key
		await user.click(within(sidebar).getByText(/User One/));

		// Verify App navigates to it
		// Main view should show User One
		await within(main).findByText(/User One/);

		// And NOT User Two (in main view)
		// Note: queryByText might find it in the sidebar if we don't scope to main
		expect(within(main).queryByText(/User Two/)).not.toBeInTheDocument();
	});

	it('handles ?key=... URL parameter', async () => {
		// Set up URL with key parameter
		const url = new URL(window.location.href);
		url.searchParams.set('key', key1.privateKey);
		window.history.replaceState({}, '', url.toString());

		// Manually sync router state because replaceState doesn't trigger it
		router.path = url.pathname;
		router.search = url.search;

		render(App);

		// Verify it gets added to the store and sidebar automatically
		const sidebar = screen.getByRole('complementary', { name: /Sidebar/i });
		await within(sidebar).findByText(/User One/);

		const main = screen.getByRole('main');
		await within(main).findByText(/User One/);

		// Verify URL is updated to use fingerprint instead of raw key
		await waitFor(() => {
			const currentUrl = new URL(window.location.href);
			expect(currentUrl.searchParams.has('key')).toBe(false);
			expect(currentUrl.searchParams.has('fingerprint')).toBe(true);
		});
	});
});
