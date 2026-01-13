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
				value: 'Test content'
			}
		});

		const textarea = getByRole('textbox');
		expect(textarea).toHaveValue('Test content');
	});

	it('does not render buttons when no buttons prop is provided', () => {
		const { container } = render(CopyableTextarea, {
			props: {
				value: 'Test content'
			}
		});

		// Verify that no buttons are rendered
		const customButtons = container.querySelector('[data-testid="custom-buttons"]');
		expect(customButtons).not.toBeInTheDocument();
	});

	it('does not render buttons when value is empty even if buttons prop is provided', () => {
		const { container } = render(CopyableTextarea, {
			props: {
				value: '',
				buttons: true
			}
		});

		// Verify that buttons are not rendered when value is empty
		const customButtons = container.querySelector('[data-testid="custom-buttons"]');
		expect(customButtons).not.toBeInTheDocument();
	});

	it('selects all text when textarea is focused', async () => {
		const { getByRole } = render(CopyableTextarea, {
			props: {
				value: 'Select all text'
			}
		});

		const textarea = getByRole('textbox') as HTMLTextAreaElement;
		const selectSpy = vi.spyOn(textarea, 'select');

		await fireEvent.focus(textarea);

		expect(selectSpy).toHaveBeenCalled();
	});
});
