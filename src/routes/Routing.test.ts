/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/svelte';
import App from '../App.svelte';

describe('Routing', () => {
	beforeEach(() => {
		// Reset router state before each test
		window.history.pushState({}, '', '/');
	});

	it('navigates to Guide page when clicking Guide link', async () => {
		render(App);

		// Initially on PGP Workflow page
		// The PGP Workflow page now has a sidebar with "Import Key" and "Generate Private Key"
		// and a main area with "Public Key" input.
		// However, the "Public Key" input might be inside a fieldset or have a different label.
		// Let's check for something more robust, or just check that Guide text is NOT there.
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();

		// Click Guide link
		const guideLink = screen.getByRole('link', { name: 'Guide' });
		await fireEvent.click(guideLink);

		// Should now be on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();
		// The PGP Workflow components should be gone
		// The "Public Key" label is dynamic based on isPrivate, but "Paste PGP Key (Armored)..." placeholder is constant in RawKeyInput
		expect(screen.queryByPlaceholderText('Paste PGP Key (Armored)...')).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/Guide');
	});

	it('navigates back to Home page when clicking PGP Help link', async () => {
		// Start on Guide page
		window.history.pushState({}, '', '/Guide');
		render(App);

		// Verify we are on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();

		// Click Home link
		// There are multiple links with name 'pgp.help' (one in navbar, one in footer/content)
		// We want the one in the navbar.
		const homeLinks = screen.getAllByRole('link', { name: 'pgp.help' });
		const navbarHomeLink = homeLinks[0]; // Assuming the first one is in the navbar
		await fireEvent.click(navbarHomeLink);

		// Should now be on PGP Workflow page
		expect(screen.getByLabelText(/Public Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/');
	});
});
