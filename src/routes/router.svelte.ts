import { SvelteURLSearchParams } from 'svelte/reactivity';
import { Key } from 'openpgp';
const BASE_PATH = import.meta.env.BASE_URL || '/';

/**
 * Strip BASE_PATH from a full pathname, returning the app-relative path
 */
function stripBasePath(fullPath: string): string {
	if (BASE_PATH === '/' || !fullPath.startsWith(BASE_PATH)) {
		return fullPath;
	}
	const stripped = fullPath.slice(BASE_PATH.length);
	return stripped || '/';
}

/**
 * Add BASE_PATH to an app-relative path, returning the full pathname
 */
function addBasePath(appPath: string): string {
	if (BASE_PATH === '/') {
		return appPath;
	}
	// Remove trailing slash from BASE_PATH for consistency
	const base = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;
	// Ensure appPath starts with /
	const path = appPath.startsWith('/') ? appPath : '/' + appPath;
	return base + path;
}

export enum Pages {
	HOME = 'Home',
	GUIDE = 'Guide',
	GENERATE_KEY = 'GenerateKey'
}

class Router {
	// Raw state tracking window location (source of truth)
	#raw = $state({
		path: typeof window !== 'undefined' ? window.location.pathname : '',
		search: typeof window !== 'undefined' ? window.location.search : ''
	});

	constructor() {
		if (typeof window !== 'undefined') {
			// Check for redirect from 404.html
			const redirect = sessionStorage.redirect;
			if (redirect) {
				delete sessionStorage.redirect;
				window.history.replaceState(null, '', redirect);
				// Update internal state immediately
				this.#raw.path = window.location.pathname;
				this.#raw.search = window.location.search;
			}

			const updateState = () => {
				this.#raw.path = window.location.pathname;
				this.#raw.search = window.location.search;
			};

			window.addEventListener('popstate', updateState);
		}
	}

	// Derived state for high-level routing
	activeRoute = $derived.by(() => {
		// Strip BASE_PATH to get app-relative path
		const appPath = stripBasePath(this.#raw.path);
		const pathParts = appPath.split('/').filter(Boolean);
		const lastSegment = pathParts[pathParts.length - 1];

		let page: Pages = Pages.HOME;

		if (lastSegment == undefined) {
			page = Pages.HOME;
		} else if (Object.values(Pages).includes(lastSegment as Pages) && lastSegment !== Pages.HOME) {
			page = lastSegment as Pages;
		} else {
			// We're somewhere odd. Remove the last segment and redirect to root.
			console.log('Router: Unrecognized path segment:', lastSegment, ' - redirecting to root.');
			setTimeout(() => {
				this.#navigate('/', true);
			});
			// Still return HOME page while redirect is pending
			page = Pages.HOME;
		}

		// Parse query params
		const params = new SvelteURLSearchParams(this.#raw.search);
		const keyParam = params.get('key');
		const fingerprint = params.get('fp');

		//Remove any query params, as they are now stored in the state and they confuse things.
		//console.log('Router setting URL to', this.#raw.path);
		window.history.replaceState({}, '', this.#raw.path);

		return {
			page,
			pgp: {
				fingerprint,
				keyParam
			}
		};
	});

	/**
	 * Internal navigation method
	 * @param appPath - App-relative path (e.g., "/Guide" or "/abc123")
	 * @param replace - Whether to replace history instead of push
	 */
	#navigate(appPath: string, replace: boolean = false) {
		// console.trace('Router navigating to', appPath, 'replace=', replace);

		// Convert app-relative path to full pathname
		const fullPath = addBasePath(appPath);

		const url = new URL(fullPath, window.location.origin);

		if (replace) {
			window.history.replaceState({}, '', url.toString());
		} else {
			window.history.pushState({}, '', url.toString());
		}

		this.#raw.path = url.pathname;
		this.#raw.search = url.search;
	}

	/**
	 * Navigate to a specific page
	 */
	openPage(page: Pages) {
		if (page === Pages.HOME) {
			this.#navigate('/');
		} else {
			this.#navigate(`/${page}`);
		}
	}

	openHome() {
		this.openPage(Pages.HOME);
	}

	/**
	 * Navigate to home and select a specific key by fingerprint
	 */
	openKey(key: Key) {
		this.#navigate(`/?fp=${key.getFingerprint()}`);
	}
}

export const router = new Router();
