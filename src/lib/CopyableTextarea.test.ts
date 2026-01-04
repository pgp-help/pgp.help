import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CopyableTextarea from './CopyableTextarea.svelte';

describe('CopyableTextarea', () => {
	// Mock navigator.clipboard
	const mockClipboard = {
		writeText: vi.fn()
	};
	Object.defineProperty(navigator, 'clipboard', {
		value: mockClipboard,
		configurable: true
	});

	it('renders textarea with given value', () => {
		const { getByRole } = render(CopyableTextarea, {
			props: {
				value: 'Test content',
				showCopyButton: true
			}
		});

		const textarea = getByRole('textbox');
		expect(textarea).toHaveValue('Test content');
	});

	it('copies text to clipboard when copy button is clicked', async () => {
		mockClipboard.writeText.mockResolvedValue(undefined);

		const { getByLabelText, getByText } = render(CopyableTextarea, {
			props: {
				value: 'Copy me',
				showCopyButton: true
			}
		});

		const copyButton = getByLabelText('Copy to clipboard');
		await fireEvent.click(copyButton);

		expect(mockClipboard.writeText).toHaveBeenCalledWith('Copy me');

		// Check toast appears
		const toastElement = getByText('Copied!');
		expect(toastElement).toBeTruthy();
	});

	it('selects all text when textarea is focused', async () => {
		const { getByRole } = render(CopyableTextarea, {
			props: {
				value: 'Select all text',
				showCopyButton: true
			}
		});

		const textarea = getByRole('textbox') as HTMLTextAreaElement;
		const selectSpy = vi.spyOn(textarea, 'select');

		await fireEvent.focus(textarea);

		expect(selectSpy).toHaveBeenCalled();
	});

	it('handles copy failure gracefully', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		mockClipboard.writeText.mockRejectedValue(new Error('Copy failed'));

		const { getByLabelText } = render(CopyableTextarea, {
			props: {
				value: 'Test copy',
				showCopyButton: true
			}
		});

		const copyButton = getByLabelText('Copy to clipboard');
		await fireEvent.click(copyButton);

		expect(mockClipboard.writeText).toHaveBeenCalledWith('Test copy');
		expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));

		consoleErrorSpy.mockRestore();
	});
});
