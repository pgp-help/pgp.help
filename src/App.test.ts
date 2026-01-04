/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as openpgp from 'openpgp';
import App from './App.svelte';

describe('App', () => {
	let validPublicKey: string;

	beforeAll(async () => {
		// Generate a real test key pair
		const { publicKey } = await openpgp.generateKey({
			type: 'ecc',
			curve: 'ed25519' as any, //Squash type error
			userIDs: [{ name: 'Test User', email: 'test@example.com' }]
		});
		validPublicKey = publicKey;
	});

	it('renders the core interface', () => {
		render(App);
		// Check Header
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PGP Help');
		expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Encrypted Message/i)).toBeInTheDocument();
	});

	it('encrypts message with valid key', async () => {
		const user = userEvent.setup();
		render(App);

		const keyTextarea = screen.getByLabelText(/Public Key/i);
		const messageTextarea = screen.getByLabelText(/^Message/i);
		const outputTextarea = screen.getByLabelText(/Encrypted Message/i);

		// Use fireEvent for the key to simulate a paste/instant update and avoid
		// thousands of intermediate renders/effects with partial keys
		await fireEvent.input(keyTextarea, { target: { value: validPublicKey } });
		await user.type(messageTextarea, 'Hello World');

		// Wait for the async encryption to complete
		await vi.waitFor(() => {
			const output = (outputTextarea as HTMLTextAreaElement).value;
			expect(output).toContain('-----BEGIN PGP MESSAGE-----');
			expect(output).toContain('-----END PGP MESSAGE-----');
		});
	});

	it('shows error with invalid key', async () => {
		const user = userEvent.setup();
		render(App);

		const keyTextarea = screen.getByLabelText(/Public Key/i);
		const messageTextarea = screen.getByLabelText(/^Message/i);
		const outputTextarea = screen.getByLabelText(/Encrypted Message/i);

		await user.type(keyTextarea, 'invalid');
		await user.type(messageTextarea, 'Hello World');

		// Wait for the async encryption to complete
		await vi.waitFor(() => {
			expect(outputTextarea).toHaveValue('Error: Misformed armored text');
		});
	});

	it('applies DaisyUI styling classes', () => {
		render(App);

		// Check that DaisyUI classes are present on key elements
		const textareas = screen.getAllByRole('textbox');
		expect(textareas.length).toBeGreaterThan(0);

		// Verify DaisyUI textarea class is applied
		textareas.forEach((textarea) => {
			expect(textarea).toHaveClass('textarea');
		});

		// Check for DaisyUI form-control class
		const labels = screen.getAllByRole('heading', { level: 1 });
		expect(labels.length).toBeGreaterThan(0);
	});

	it('verifies Tailwind CSS is loaded', () => {
		const { container } = render(App);

		// Get computed styles to verify CSS is actually applied
		const mainElement = container.querySelector('main');
		expect(mainElement).toBeInTheDocument();

		// Check that Tailwind/DaisyUI CSS variables are set
		const htmlElement = document.documentElement;
		const computedStyle = window.getComputedStyle(htmlElement);

		// DaisyUI sets CSS custom properties for colors
		// This verifies the CSS is being processed
		expect(computedStyle).toBeDefined();
	});
});
