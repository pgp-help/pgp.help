import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

// Mock jdenticon's toSvg function since it requires a browser environment
vi.mock('jdenticon', () => ({
	toSvg: vi.fn(() => '<svg></svg>')
}));

describe('Avatar', () => {
	it('renders without errors', () => {
		render(Avatar, {
			props: {
				fingerprint: 'test-fingerprint-123',
				size: 64
			}
		});

		// Check that img element is rendered
		const img = document.querySelector('img');
		expect(img).toBeTruthy();
	});

	it('renders with custom size', () => {
		render(Avatar, {
			props: {
				fingerprint: 'test-fingerprint-456',
				size: 48
			}
		});

		const img = document.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.classList.contains('w-[48px]')).toBe(true);
		expect(img?.classList.contains('h-[48px]')).toBe(true);
	});

	it('renders with custom class', () => {
		render(Avatar, {
			props: {
				fingerprint: 'test-fingerprint-123',
				size: 64,
				class: 'custom-class'
			}
		});

		const avatarContainer = document.querySelector('.avatar');
		expect(avatarContainer).toBeTruthy();
		expect(avatarContainer?.classList.contains('custom-class')).toBe(true);
	});

	it('renders with alt text', () => {
		render(Avatar, {
			props: {
				fingerprint: 'test-fingerprint-abc',
				size: 64,
				alt: 'Custom alt text'
			}
		});

		const img = document.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('Custom alt text');
	});

	it('renders with default size when not specified', () => {
		render(Avatar, {
			props: {
				fingerprint: 'test-fingerprint-default'
			}
		});

		const img = document.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.classList.contains('w-[64px]')).toBe(true);
		expect(img?.classList.contains('h-[64px]')).toBe(true);
	});
});
