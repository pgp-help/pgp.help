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
		expect(screen.getByPlaceholderText(/Paste PGP Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();

		// Click Guide link
		const guideLink = screen.getByRole('link', { name: 'Guide' });
		await fireEvent.click(guideLink);

		// Should now be on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText(/Paste PGP Key/i)).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/Guide');
	});

	it('navigates back to Home page when clicking PGP Help link', async () => {
		// Start on Guide page
		window.history.pushState({}, '', '/Guide');
		render(App);

		// Verify we are on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();

		// Click Home link
		const homeLinks = screen.getAllByRole('link', { name: 'pgp.help' });
		await fireEvent.click(homeLinks[0]);

		// Should now be on PGP Workflow page
		expect(screen.getByPlaceholderText(/Paste PGP Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();
		expect(window.location.pathname).toBe('/');
	});
});
