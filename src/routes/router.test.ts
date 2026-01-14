import { describe, it, expect, beforeEach, vi } from 'vitest';
import { router, Pages, PGPMode } from './router.svelte';
import { render, screen, fireEvent } from '@testing-library/svelte';
import App from '../App.svelte';

// Helper to simulate user entering a URL
function simulateNavigation(path: string) {
	// For hash routing, we update the hash
	// If path starts with /, treat it as hash path
	const hash = path.startsWith('/') ? path : '/' + path;
	window.location.hash = hash;
	window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('Router', () => {
	beforeEach(() => {
		// Reset to home before each test
		window.location.hash = '';
		window.location.search = '';
		window.history.replaceState({}, '', '/');
		// Reset router internal state if possible, or just rely on navigation
		router.openHome();
	});

	describe('Page Navigation', () => {
		it('parses home page from root', () => {
			simulateNavigation('/');
			expect(router.activeRoute.page).toBe(Pages.HOME);
			expect(router.activeRoute.pgp.fingerprint).toBeNull();
		});

		it('parses Guide page correctly', () => {
			simulateNavigation('/Guide');
			expect(router.activeRoute.page).toBe(Pages.GUIDE);
			expect(router.activeRoute.pgp.fingerprint).toBeNull();
		});

		it('parses GenerateKey page correctly', () => {
			simulateNavigation('/GenerateKey');
			expect(router.activeRoute.page).toBe(Pages.GENERATE_KEY);
			expect(router.activeRoute.pgp.fingerprint).toBeNull();
		});

		it('redirects /Home to /', () => {
			vi.useFakeTimers();
			simulateNavigation('/Home');

			// Should initially parse as HOME
			expect(router.activeRoute.page).toBe(Pages.HOME);

			// After timeout, should redirect to /
			vi.runAllTimers();
			// Check hash instead of pathname
			expect(window.location.hash).toBe('#/');

			vi.useRealTimers();
		});
	});

	describe('Fingerprint Routing', () => {
		// Fingerprints are no longer in the URL path/hash
		// They are passed via query param 'fp' which is then consumed

		it('parses fingerprint from query param and removes it', () => {
			// Simulate ?fp=...
			const fp = 'abc123def4567890';
			window.location.search = `?fp=${fp}`;
			// Trigger router to consume params (re-instantiate or call method if exposed)
			// Since router is a singleton created at module level, we might need to trigger the logic.
			// The logic runs in constructor and on popstate.
			window.dispatchEvent(new PopStateEvent('popstate'));

			expect(router.activeRoute.pgp.fingerprint).toBe(fp);
			// Should have removed from search
			expect(window.location.search).toBe('');
		});
	});

	describe('Navigation Methods', () => {
		it('openPage navigates to Guide', () => {
			router.openPage(Pages.GUIDE);
			expect(window.location.hash).toBe('#/Guide');
			expect(router.activeRoute.page).toBe(Pages.GUIDE);
		});

		it('openPage navigates to home', () => {
			router.openPage(Pages.HOME);
			expect(window.location.hash).toBe('#/');
			expect(router.activeRoute.page).toBe(Pages.HOME);
		});
	});

	describe('Edge Cases', () => {
		it('handles empty path parts', () => {
			simulateNavigation('/');
			expect(router.activeRoute.page).toBe(Pages.HOME);
		});

		it('handles trailing slashes', () => {
			simulateNavigation('/Guide/');
			expect(router.activeRoute.page).toBe(Pages.GUIDE);
		});

		it('handles unknown paths as home', () => {
			simulateNavigation('/unknown-page');
			expect(router.activeRoute.page).toBe(Pages.HOME);
		});
	});
});

// This is a bit of a noddy test (thanks Claude) but it does help teach me how enums work!

describe('PGPMode enum', () => {
	it('should have correct enum values', () => {
		expect(PGPMode.ENCRYPT).toBe('encrypt');
		expect(PGPMode.DECRYPT).toBe('decrypt');
	});

	it('should be compatible with string literals', () => {
		// This tests that our enum values match the expected string literals
		const encryptMode: string = PGPMode.ENCRYPT;
		const decryptMode: string = PGPMode.DECRYPT;

		expect(encryptMode).toBe('encrypt');
		expect(decryptMode).toBe('decrypt');
	});

	it('should work in switch statements', () => {
		function getModeDescription(mode: PGPMode): string {
			switch (mode) {
				case PGPMode.ENCRYPT:
					return 'Encryption mode';
				case PGPMode.DECRYPT:
					return 'Decryption mode';
				default:
					return 'Unknown mode';
			}
		}

		expect(getModeDescription(PGPMode.ENCRYPT)).toBe('Encryption mode');
		expect(getModeDescription(PGPMode.DECRYPT)).toBe('Decryption mode');
	});
});

describe('Routing', () => {
	beforeEach(() => {
		// Reset router state before each test
		window.location.hash = '';
	});

	it('navigates to Guide page when clicking Guide link', async () => {
		render(App);

		// Initially on PGP Workflow page
		expect(screen.getByPlaceholderText(/Paste PGP Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();

		// Click Guide link
		const guideLink = screen.getByRole('link', { name: 'Guide' });
		await fireEvent.click(guideLink);

		// Should now be on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();
		// The PGP Workflow components should be gone
		// The "Public Key" label is dynamic based on isPrivate, but "Paste PGP Key (Armored)..." placeholder is constant in RawKeyInput
		expect(screen.queryByPlaceholderText('Paste PGP Key (Armored)...')).not.toBeInTheDocument();
		expect(window.location.hash).toBe('#/Guide');
	});

	it('navigates back to Home page when clicking PGP Help link', async () => {
		// Start on Guide page
		window.location.hash = '#/Guide';
		render(App);

		// Verify we are on Guide page
		expect(screen.getByText('What is PGP?')).toBeInTheDocument();

		// Click Home link
		// There are multiple links with name 'pgp.help' (one in navbar, one in footer/content)
		// We want the one in the navbar.
		const homeLinks = screen.getAllByRole('link', { name: 'pgp.help' });
		const navbarHomeLink = homeLinks[0]; // Assuming the first one is in the navbar
		await fireEvent.click(navbarHomeLink);

		// Should now be on PGP Workflow page
		expect(screen.getByPlaceholderText(/Paste PGP Key/i)).toBeInTheDocument();
		expect(screen.queryByText('What is PGP?')).not.toBeInTheDocument();
		expect(window.location.hash).toBe('#/');
	});
});
