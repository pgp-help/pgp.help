import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CopyableTextarea from './CopyableTextarea.svelte';

describe('CopyableTextarea', () => {
	// Mock navigator.clipboard
	const mockClipboard = {
		writeText: vi.fn(),
		readText: vi.fn()
	};
	Object.defineProperty(navigator, 'clipboard', {
		value: mockClipboard,
		configurable: true
	});

	it('renders textarea with given value', () => {
		const { getByRole } = render(CopyableTextarea, {
			props: {
				value: 'Test content',
				showButtons: true
			}
		});

		const textarea = getByRole('textbox');
		expect(textarea).toHaveValue('Test content');
	});

	it('copies text to clipboard when copy button is clicked', async () => {
		mockClipboard.writeText.mockResolvedValue(undefined);

		const { getByLabelText } = render(CopyableTextarea, {
			props: {
				value: 'Copy me',
				showButtons: true
			}
		});

		const copyButton = getByLabelText('Copy to clipboard');
		await fireEvent.click(copyButton);

		expect(mockClipboard.writeText).toHaveBeenCalledWith('Copy me');

		// Check tooltip updates
		// Since the tooltip text is inside the button or a sibling, we need to check if "Copied!" is present
		// The implementation uses a data-tip attribute on a parent div, but the text "Copied!" is not rendered as text content unless the tooltip is active and rendered by CSS/JS library.
		// However, in the component code: copyTooltip = 'Copied!';
		// And: <div class="tooltip tooltip-left" data-tip={copyTooltip}>
		// So we should check if the data-tip attribute updates.

		// Wait for state update
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Find the tooltip wrapper. It's the parent of the button.
		const tooltipWrapper = copyButton.closest('.tooltip');
		expect(tooltipWrapper).toHaveAttribute('data-tip', 'Copied!');
	});

	it('selects all text when textarea is focused', async () => {
		const { getByRole } = render(CopyableTextarea, {
			props: {
				value: 'Select all text',
				showButtons: true
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
				showButtons: true
			}
		});

		const copyButton = getByLabelText('Copy to clipboard');
		await fireEvent.click(copyButton);

		expect(mockClipboard.writeText).toHaveBeenCalledWith('Test copy');
		expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));

		consoleErrorSpy.mockRestore();
	});
});
