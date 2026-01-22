/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/svelte';
import GenerateKey from './GenerateKey.svelte';
import * as pgp from './pgp';
import * as crypto from './crypto';

// Mock dependencies
vi.mock('../router.svelte.js', () => ({
	router: {
		openHome: vi.fn(),
		openKey: vi.fn()
	}
}));

vi.mock('./pgp', () => ({
	generateKeyPair: vi.fn()
}));

vi.mock('./crypto', () => ({
	getKeyDetails: vi.fn(),
	KeyType: {
		PGP: 'pgp',
		AGE: 'age'
	}
}));

vi.mock('./KeyList.svelte', () => ({
	default: vi.fn(() => ({ $$: {} }))
}));

describe('GenerateKey', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the generation form', () => {
		render(GenerateKey, { onKeyGenerated: vi.fn(), onCancel: vi.fn() });

		expect(screen.getByText('Generate New Key')).toBeInTheDocument();
		expect(screen.getByLabelText('Name')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText(/Passphrase/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Generate Key' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('generates key and calls onKeyGenerated on success', async () => {
		const mockKeyPair = {
			privateKey: 'mock-private-key',
			publicKey: 'mock-public-key',
			revocationCertificate: 'mock-rev-cert'
		};

		const mockKey = {
			type: crypto.KeyType.PGP,
			isPrivate: () => true,
			getId: () => 'mock-id',
			getFingerprint: () => 'mock-fp',
			getArmor: () => 'mock-armor',
			getUserIDs: () => ['Test User <test@example.com>'],
			isDecrypted: () => true,
			toPublic: () => mockKey
		};
		vi.mocked(pgp.generateKeyPair).mockResolvedValue(mockKeyPair);
		vi.mocked(crypto.getKeyDetails).mockResolvedValue(mockKey);

		const onKeyGenerated = vi.fn();
		const onCancel = vi.fn();

		render(GenerateKey, { onKeyGenerated, onCancel });

		await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
		await fireEvent.input(screen.getByLabelText('Email'), {
			target: { value: 'test@example.com' }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Generate Key' }));

		// Wait for async operations to complete
		await vi.waitFor(() => {
			expect(pgp.generateKeyPair).toHaveBeenCalledWith('Test User', 'test@example.com', '');
			expect(onKeyGenerated).toHaveBeenCalledWith(mockKey);
		});
	});

	it('handles generation errors', async () => {
		vi.mocked(pgp.generateKeyPair).mockRejectedValue(new Error('Generation failed'));

		render(GenerateKey, { onKeyGenerated: vi.fn(), onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
		await fireEvent.input(screen.getByLabelText('Email'), {
			target: { value: 'test@example.com' }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Generate Key' }));

		await screen.findByText('Generation failed');
	});

	it('calls onCancel when cancel is clicked', async () => {
		const onCancel = vi.fn();
		render(GenerateKey, { onKeyGenerated: vi.fn(), onCancel });

		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onCancel).toHaveBeenCalled();
	});
});
