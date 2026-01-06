import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import PGPKey from './PGPKey.svelte';
import * as pgp from './pgp';

// Mock the getKeyDetails function to avoid expensive key parsing in UI tests
vi.mock('./pgp', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./pgp')>();
	return {
		...actual,
		getKeyDetails: vi.fn()
	};
});

describe('PGPKey Component', () => {
	const mockKey = {
		getFingerprint: () => '1234567890ABCDEF',
		getKeyID: () => ({ toHex: () => 'ABCDEF12' }),
		getUserIDs: () => ['Test User <test@example.com>'],
		isPrivate: () => false,
		getCreationTime: () => new Date('2023-01-01'),
		getExpirationTime: async () => null,
		getAlgorithmInfo: () => ({ algorithm: 'rsa', bits: 4096 }),
		armor: () =>
			'-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n...cleaned...\n-----END PGP PUBLIC KEY BLOCK-----'
	};

	it('renders CopyableTextarea when value is empty', () => {
		const { getByPlaceholderText } = render(PGPKey, {
			props: {
				value: ''
			}
		});

		expect(getByPlaceholderText('Paste PGP Key (Armored)...')).toBeTruthy();
	});

	it('renders key details widget when valid key is provided', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(mockKey as any);

		const { getByText, queryByPlaceholderText } = render(PGPKey, {
			props: {
				value: 'valid-armored-key'
			}
		});

		// Wait for the async effect to resolve
		await waitFor(() => {
			expect(getByText('Test User <test@example.com>')).toBeTruthy();
		});

		expect(getByText('ABCDEF12')).toBeTruthy();
		expect(getByText('1234567890ABCDEF')).toBeTruthy();
		expect(getByText('Public Key')).toBeTruthy();
		expect(getByText('RSA (4096 bit)')).toBeTruthy();

		// Input should be hidden
		expect(queryByPlaceholderText('Paste PGP Key (Armored)...')).toBeNull();
	});

	it('clears the key when remove button is clicked', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(mockKey as any);

		const { getByLabelText, getByPlaceholderText } = render(PGPKey, {
			props: {
				value: 'valid-armored-key'
			}
		});

		await waitFor(() => {
			expect(getByLabelText('Remove key')).toBeTruthy();
		});

		const removeBtn = getByLabelText('Remove key');
		await fireEvent.click(removeBtn);

		// Should revert to input mode
		expect(getByPlaceholderText('Paste PGP Key (Armored)...')).toBeTruthy();

		// Value should be cleared (checking via prop binding requires component interaction check or checking the input value)
		const input = getByPlaceholderText('Paste PGP Key (Armored)...') as HTMLTextAreaElement;
		expect(input.value).toBe('');
	});

	it('nudges for decryption when nudgeForDecryption is called', async () => {
		const mockPrivateKey = {
			...mockKey,
			isPrivate: () => true,
			isDecrypted: () => false
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(mockPrivateKey as any);

		const { component, container } = render(PGPKey, {
			props: {
				value: 'valid-private-key'
			}
		});

		await waitFor(() => {
			expect(container.querySelector('.form-control')).toBeTruthy();
		});

		const formControl = container.querySelector('.form-control');
		expect(formControl?.classList.contains('shake')).toBe(false);

		// Call the exported function
		component.nudgeForDecryption();

		// Wait for the class to be applied
		await waitFor(() => {
			expect(formControl?.classList.contains('shake')).toBe(true);
		});

		// Wait for the animation to finish (mocking timers would be better but for simplicity)
		// We can use vi.useFakeTimers() if we want to be precise
	});
});
