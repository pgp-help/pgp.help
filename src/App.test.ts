/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';

// Mock the encryption library to avoid using real PGP in UI tests
vi.mock('./lib/pgp.ts', () => ({
  encryptMessage: vi.fn(() => Promise.resolve('FAKE_ENCRYPTED_TEXT')),
  decryptMessage: vi.fn(() => Promise.resolve('FAKE_DECRYPTED_TEXT')),
  signMessage: vi.fn(() => Promise.resolve('FAKE_SIGNED_TEXT')),
  verifySignature: vi.fn(() => Promise.resolve(true))
}));

describe('App', () => {

  it('renders the core interface', () => {
		render(App);
    // Check Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PGP Help');
    expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Encrypted Message/i)).toBeInTheDocument();
	});

});

