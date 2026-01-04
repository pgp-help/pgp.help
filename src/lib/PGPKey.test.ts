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
		getAlgorithmInfo: () => ({ algorithm: 'rsa', bits: 4096 })
	};

	it('renders CopyableTextarea when value is empty', () => {
		const { getByPlaceholderText } = render(PGPKey, {
			props: {
				value: '',
				placeholder: 'Enter key here'
			}
		});

		expect(getByPlaceholderText('Enter key here')).toBeTruthy();
	});

	it('renders key details widget when valid key is provided', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(mockKey as any);

		const { getByText, queryByPlaceholderText } = render(PGPKey, {
			props: {
				value: 'valid-armored-key',
				placeholder: 'Enter key here'
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
		expect(queryByPlaceholderText('Enter key here')).toBeNull();
	});

	it('clears the key when remove button is clicked', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(mockKey as any);

		const { getByLabelText, getByPlaceholderText } = render(PGPKey, {
			props: {
				value: 'valid-armored-key',
				placeholder: 'Enter key here'
			}
		});

		await waitFor(() => {
			expect(getByLabelText('Remove key')).toBeTruthy();
		});

		const removeBtn = getByLabelText('Remove key');
		await fireEvent.click(removeBtn);

		// Should revert to input mode
		expect(getByPlaceholderText('Enter key here')).toBeTruthy();

		// Value should be cleared (checking via prop binding requires component interaction check or checking the input value)
		const input = getByPlaceholderText('Enter key here') as HTMLTextAreaElement;
		expect(input.value).toBe('');
	});
});
