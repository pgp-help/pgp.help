import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';

describe('App', () => {
	it('renders the heading', () => {
		render(App);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vite + Svelte');
	});

	it('renders the Vite logo with link', () => {
		render(App);
		const viteLink = screen.getByRole('link', { name: /vite logo/i });
		expect(viteLink).toHaveAttribute('href', 'https://vite.dev');
	});

	it('renders the Svelte logo with link', () => {
		render(App);
		const svelteLink = screen.getByRole('link', { name: /svelte logo/i });
		expect(svelteLink).toHaveAttribute('href', 'https://svelte.dev');
	});

	it('renders the read the docs text', () => {
		render(App);
		expect(screen.getByText(/click on the vite and svelte logos/i)).toBeInTheDocument();
	});

	it('contains a link to SvelteKit', () => {
		render(App);
		const kitLink = screen.getByRole('link', { name: /sveltekit/i });
		expect(kitLink).toHaveAttribute('href', 'https://github.com/sveltejs/kit#readme');
	});
});
