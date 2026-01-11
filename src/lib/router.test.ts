import { describe, it, expect, beforeEach, vi } from 'vitest';
import { router, Pages } from './router.svelte';

// Helper to simulate user entering a URL
function simulateNavigation(path: string) {
	window.history.pushState({}, '', path);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

describe('Router', () => {
	beforeEach(() => {
		// Reset to home before each test
		window.history.replaceState({}, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate'));
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
			expect(window.location.pathname).toBe('/');

			vi.useRealTimers();
		});
	});

	describe('Fingerprint Routing', () => {
		it('parses valid fingerprint (16 hex chars)', () => {
			simulateNavigation('/abc123def4567890');
			expect(router.activeRoute.page).toBe(Pages.HOME);
			expect(router.activeRoute.pgp.fingerprint).toBe('abc123def4567890');
		});

		it('parses valid fingerprint (40 hex chars)', () => {
			const fp = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4';
			simulateNavigation(`/${fp}`);
			expect(router.activeRoute.page).toBe(Pages.HOME);
			expect(router.activeRoute.pgp.fingerprint).toBe(fp);
		});

		it('does not treat short hex strings as fingerprints', () => {
			simulateNavigation('/abc123');
			expect(router.activeRoute.page).toBe(Pages.HOME);
			expect(router.activeRoute.pgp.fingerprint).toBeNull();
		});

		it('is case insensitive for fingerprints', () => {
			simulateNavigation('/ABCDEF1234567890');
			expect(router.activeRoute.pgp.fingerprint).toBe('ABCDEF1234567890');
		});
	});

	describe('BASE_PATH handling', () => {
		// Note: These tests assume BASE_PATH is '/' in test environment
		// If you need to test with a different BASE_PATH, you'll need to
		// mock import.meta.env.BASE_URL before importing the router

		it('handles paths without base path', () => {
			simulateNavigation('/Guide');
			expect(router.activeRoute.page).toBe(Pages.GUIDE);
		});
	});

	describe('Navigation Methods', () => {
		it('openPage navigates to Guide', () => {
			router.openPage(Pages.GUIDE);
			expect(window.location.pathname).toBe('/Guide');
			expect(router.activeRoute.page).toBe(Pages.GUIDE);
		});

		it('openPage navigates to home', () => {
			router.openPage(Pages.HOME);
			expect(window.location.pathname).toBe('/');
			expect(router.activeRoute.page).toBe(Pages.HOME);
		});

		it('openKey navigates to fingerprint', () => {
			const fp = 'abc123def4567890';
			router.openKey(fp);
			expect(window.location.pathname).toBe(`/${fp}`);
			expect(router.activeRoute.pgp.fingerprint).toBe(fp);
		});
	});

	describe('Browser History', () => {
		it('navigates with pushState by default', () => {
			const initialLength = window.history.length;
			router.openPage(Pages.GUIDE);
			router.openPage(Pages.GENERATE_KEY);
			// Note: history.length might not increase in test environment
			// but we can verify the navigation happened
			expect(window.location.pathname).toBe('/GenerateKey');
			expect(window.history.length).toBeGreaterThanOrEqual(initialLength + 2);
		});

		it('responds to back button', () => {
			router.openPage(Pages.GUIDE);
			router.openPage(Pages.GENERATE_KEY);

			window.history.back();
			window.dispatchEvent(new PopStateEvent('popstate'));

			expect(router.activeRoute.page).toBe(Pages.GUIDE);
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
