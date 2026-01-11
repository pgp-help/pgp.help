import { SvelteURLSearchParams } from 'svelte/reactivity';

const BASE_PATH = import.meta.env.BASE_URL || '/';

/**
 * Enum for PGP operation modes
 */
export enum PGPMode {
	ENCRYPT = 'encrypt',
	DECRYPT = 'decrypt',
	SIGN = 'sign',
	VERIFY = 'verify'
}

export enum Pages {
	HOME = 'Home',
	GUIDE = 'Guide',
	GENERATE_KEY = 'GenerateKey'
}

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

class Router {
	// Raw state tracking window location (source of truth)
	#raw = $state({
		path: window.location.pathname,
		search: window.location.search
	});

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener('popstate', () => {
				this.#raw.path = window.location.pathname;
				this.#raw.search = window.location.search;
			});
		}
	}

	// Derived state for high-level routing
	activeRoute = $derived.by(() => {
		// Strip BASE_PATH to get app-relative path
		const appPath = stripBasePath(this.#raw.path);
		const pathParts = appPath.split('/').filter(Boolean);
		const lastSegment = pathParts[pathParts.length - 1];

		let page: Pages = Pages.HOME;
		let fingerprint: string | null = null;

		// Handle special case: /Home redirects to /
		if (lastSegment === Pages.HOME) {
			setTimeout(() => {
				this.#navigate('/', true);
			});
			// Still return HOME page while redirect is pending
			page = Pages.HOME;
		}
		// Check for named pages
		// Use Object.values to get all enum values and check if lastSegment matches any of them
		else if (Object.values(Pages).includes(lastSegment as Pages)) {
			page = lastSegment as Pages;
		}
		// Check for fingerprint (hex string, 16+ chars)
		else if (lastSegment) {
			fingerprint = lastSegment;
			page = Pages.HOME; // Viewing a key on home page
		}
		// Otherwise, we're at root/home
		else {
			page = Pages.HOME;
		}

		// Parse query params
		const params = new SvelteURLSearchParams(this.#raw.search);
		const keyParam = params.get('key');
		const mode = (params.get('mode') as PGPMode) || PGPMode.ENCRYPT;

		return {
			page,
			pgp: {
				fingerprint,
				keyParam,
				mode
			}
		};
	});

	/**
	 * Internal navigation method
	 * @param appPath - App-relative path (e.g., "/Guide" or "/abc123")
	 * @param replace - Whether to replace history instead of push
	 */
	#navigate(appPath: string, replace: boolean = false) {
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
	 * Navigate to a specific key by fingerprint
	 */
	openKey(fingerprint: string, mode?: PGPMode) {
		const currentMode = this.activeRoute.pgp.mode;
		const targetMode = mode || currentMode;

		const search = new SvelteURLSearchParams();
		if (targetMode !== PGPMode.ENCRYPT) {
			search.set('mode', targetMode);
		}

		const searchStr = search.toString();
		this.#navigate(`/${fingerprint}${searchStr ? '?' + searchStr : ''}`);
	}

	/**
	 * Change the mode for the current view
	 */
	setMode(mode: PGPMode) {
		if (this.activeRoute.page !== Pages.HOME) return;

		const { fingerprint, keyParam } = this.activeRoute.pgp;
		const search = new SvelteURLSearchParams();

		if (keyParam) search.set('key', keyParam);
		if (mode !== PGPMode.ENCRYPT) search.set('mode', mode);

		const path = fingerprint ? `/${fingerprint}` : '/';
		const searchStr = search.toString();

		this.#navigate(`${path}${searchStr ? '?' + searchStr : ''}`);
	}
}

export const router = new Router();
