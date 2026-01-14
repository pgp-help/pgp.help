import { describe, it, expect, beforeEach, vi } from 'vitest';
import { router, Pages } from './router.svelte';

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
