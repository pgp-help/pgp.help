import { SvelteURLSearchParams } from 'svelte/reactivity';

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

/**
 * Parses the current URL to extract all routing information.
 * @param path The pathname to parse (defaults to current router.path)
 * @param search The search params to parse (defaults to current router.search)
 * @returns Object containing all URL components and routing info
 */
export function parsePath(path: string = router.path, search: string = router.search) {
	const pathParts = path.split('/').filter(Boolean); // Remove empty parts

	const params = new SvelteURLSearchParams(search);

	// Extract fingerprint from the last segment if it looks like a hex fingerprint (at least 16 chars)
	const lastSegment = pathParts[pathParts.length - 1];
	const fingerprint = lastSegment && lastSegment.match(/^[a-f0-9]{16,}$/i) ? lastSegment : null;

	// Base path is everything except the fingerprint
	let basePath;
	if (fingerprint) {
		basePath = '/' + pathParts.slice(0, -1).join('/');
		if (basePath === '/') basePath = '/pgp.svelte';
	} else {
		basePath = path || '/pgp.svelte';
	}

	// Extract query parameters
	const keyParam = params.get('key');
	const mode = params.get('mode');

	return {
		basePath,
		fingerprint,
		keyParam,
		mode,
		fullPath: path,
		search,
		pathParts,
		params
	};
}

/**
 * Builds a complete URL with path and query parameters.
 * @param options Configuration object for building the URL
 * @returns The constructed URL (path + search)
 */
export function buildPath(options: {
	basePath?: string;
	fingerprint?: string | null;
	keyParam?: string | null;
	mode?: string | null;
	clearKey?: boolean;
	clearMode?: boolean;
	clearFingerprint?: boolean;
}) {
	const {
		basePath = '/pgp.svelte',
		fingerprint,
		keyParam,
		mode,
		clearKey = false,
		clearMode = false,
		clearFingerprint = false
	} = options;

	// Build the path
	let path;
	if (fingerprint && !clearFingerprint) {
		// Ensure basePath starts with / and doesn't end with /
		const cleanBasePath = basePath.startsWith('/') ? basePath : '/' + basePath;
		const normalizedBasePath = cleanBasePath.endsWith('/')
			? cleanBasePath.slice(0, -1)
			: cleanBasePath;
		path = `${normalizedBasePath}/${fingerprint}`;
	} else {
		path = basePath;
	}

	// Build query parameters
	const params = new SvelteURLSearchParams();

	// Add key parameter if specified and not being cleared
	if (keyParam && !clearKey) {
		params.set('key', keyParam);
	}

	// Add mode parameter if specified and not being cleared
	if (mode && !clearMode) {
		params.set('mode', mode);
	}

	// When navigating to a fingerprint, automatically clear key param
	if (fingerprint && !clearFingerprint) {
		// Don't add key param when we have a fingerprint
	}

	const search = params.toString();
	return search ? `${path}?${search}` : path;
}

// Listen for browser navigation events (back/forward) to update the router state.
window.addEventListener('popstate', () => {
	router.path = window.location.pathname;
	router.search = window.location.search;
});
