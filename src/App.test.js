import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';

// Mock the encryption library to avoid using real PGP in UI tests
vi.mock('./lib/pgp.js', () => ({
  encryptMessage: vi.fn(() => Promise.resolve('FAKE_ENCRYPTED_TEXT'))
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

