/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as openpgp from 'openpgp';
import App from './App.svelte';


describe('App', () => {
  let validPublicKey: string;

  beforeAll(async () => {
    // Generate a real test key pair
    const { publicKey } = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519',
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

    await user.type(keyTextarea, validPublicKey);
    await user.type(messageTextarea, 'Hello World');

    // Wait for the async encryption to complete
    await vi.waitFor(() => {
      const output = outputTextarea.value;
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

});

