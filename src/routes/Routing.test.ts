/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/svelte';
import App from '../App.svelte';
import { router } from '../lib/router.svelte.js';

describe('Routing', () => {
	beforeEach(() => {
		// Reset router state before each test
		router.path = '/';
		window.history.pushState({}, '', '/');
	});

	it('navigates to Guide page when clicking Guide link', async () => {
		render(App);

		// Initially on Home page
		expect(screen.getByLabelText(/Public Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();

		// Click Guide link
		const guideLink = screen.getByRole('link', { name: 'Guide' });
		await fireEvent.click(guideLink);

		// Should now be on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Public Key/i)).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/Guide');
	});

	it('navigates back to Home page when clicking PGP Help link', async () => {
		// Start on Guide page
		router.path = '/Guide';
		window.history.pushState({}, '', '/Guide');

		render(App);

		// Verify we are on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();

		// Click Home link
		const homeLink = screen.getByRole('link', { name: 'pgp.help' });
		await fireEvent.click(homeLink);

		// Should now be on Home page
		expect(screen.getByLabelText(/Public Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/');
	});
});
