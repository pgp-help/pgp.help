import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';
import { getKeyDetails } from '../pgp/crypto';
import pgpPublicKey from '../../assets/keys/pgphelp.pem?raw';

// Mock jdenticon's toSvg function since it requires a browser environment
vi.mock('jdenticon', () => ({
	toSvg: vi.fn(() => '<svg></svg>')
}));

// Real AGE key (public key)
const AGE_PUBLIC_KEY = `age1lvyveawq3cce6sa0d2w7r86e8fynl6w06aejz4ef7vrx94z4yjvqseven8p`;

let pgpKey: Awaited<ReturnType<typeof getKeyDetails>>;
let ageKey: Awaited<ReturnType<typeof getKeyDetails>>;

describe('Avatar', () => {
	beforeAll(async () => {
		// Parse the real PGP key from the assets directory
		pgpKey = await getKeyDetails(pgpPublicKey);

		// Parse the real AGE key
		ageKey = await getKeyDetails(AGE_PUBLIC_KEY);
	});

	describe.each([
		{ keyType: 'PGP', key: () => pgpKey },
		{ keyType: 'AGE', key: () => ageKey }
	])('with $keyType key', ({ key }) => {
		it('renders without errors', () => {
			render(Avatar, {
				props: {
					cryptoKey: key(),
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
					cryptoKey: key(),
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
					cryptoKey: key(),
					size: 64,
					class: 'custom-class'
				}
			});

			const avatarContainer = document.querySelector('.avatar');
			expect(avatarContainer).toBeTruthy();
			// The custom class is applied to the inner div, not the outer .avatar container
			const innerDiv = avatarContainer?.querySelector('div');
			expect(innerDiv?.classList.contains('custom-class')).toBe(true);
		});

		it('renders with alt text', () => {
			render(Avatar, {
				props: {
					cryptoKey: key(),
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
					cryptoKey: key()
				}
			});

			const img = document.querySelector('img');
			expect(img).toBeTruthy();
			expect(img?.classList.contains('w-[64px]')).toBe(true);
			expect(img?.classList.contains('h-[64px]')).toBe(true);
		});
	});
});
