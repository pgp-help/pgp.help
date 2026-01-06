/**
 * A simple reactive router using Svelte 5 runes.
 * It tracks the current window location (pathname and search) and provides a navigate function.
 */
export const router = $state({
	path: window.location.pathname,
	search: window.location.search
});

/**
 * Navigates to a new URL using the History API.
 * Updates the reactive router state.
 * @param url The URL to navigate to (can be relative or absolute).
 */
export function navigate(url: string) {
	// Handle full URL or path
	// If it starts with /, treat as path + search
	// But URL constructor needs base if relative

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- not a reacive context
	const u = new URL(url, window.location.origin);
	window.history.pushState({}, '', u.toString());
	router.path = u.pathname;
	router.search = u.search;
}

// Listen for browser navigation events (back/forward) to update the router state.
window.addEventListener('popstate', () => {
	router.path = window.location.pathname;
	router.search = window.location.search;
});
