import { SvelteURLSearchParams } from 'svelte/reactivity';

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

class Router {
	// Raw state tracking window location (source of truth)
	#raw = $state({
		hash: typeof window !== 'undefined' ? window.location.hash : '',
		search: typeof window !== 'undefined' ? window.location.search : ''
	});

	// Internal state for routing parameters that are no longer in URL
	#internalFingerprint = $state<string | null>(null);
	#internalKeyParam = $state<string | null>(null);
	#internalMode = $state<PGPMode>(PGPMode.ENCRYPT);

	constructor() {
		if (typeof window !== 'undefined') {
			// Initial check for query params
			this.#consumeQueryParams();

			window.addEventListener('hashchange', () => {
				this.#raw.hash = window.location.hash;
			});

			// Also listen to popstate for back/forward navigation
			window.addEventListener('popstate', () => {
				this.#raw.hash = window.location.hash;
				this.#raw.search = window.location.search;
				this.#consumeQueryParams();
			});
		}
	}

	/**
	 * Checks for routing parameters in the query string (fp, key, mode),
	 * stores them internally, and removes them from the URL.
	 */
	#consumeQueryParams() {
		const params = new SvelteURLSearchParams(window.location.search);
		let changed = false;

		const fp = params.get('fp');
		if (fp) {
			this.#internalFingerprint = fp;
			params.delete('fp');
			changed = true;
		}

		const key = params.get('key');
		if (key) {
			this.#internalKeyParam = key;
			params.delete('key');
			changed = true;
		}

		const mode = params.get('mode');
		if (mode && Object.values(PGPMode).includes(mode as PGPMode)) {
			this.#internalMode = mode as PGPMode;
			params.delete('mode');
			changed = true;
		}

		if (changed) {
			const newSearch = params.toString();
			// Reconstruct URL: pathname + newSearch + hash
			const newUrl =
				window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
			window.history.replaceState({}, '', newUrl);
			this.#raw.search = newSearch;
		}
	}

	// Derived state for high-level routing
	activeRoute = $derived.by(() => {
		// Parse hash
		let hash = this.#raw.hash;
		// Remove leading # and /
		if (hash.startsWith('#')) hash = hash.slice(1);
		if (hash.startsWith('/')) hash = hash.slice(1);
		if (hash.endsWith('/')) hash = hash.slice(0, -1);

		let page: Pages = Pages.HOME;

		// Handle special case: #/Home redirects to #/
		if (hash === Pages.HOME) {
			setTimeout(() => {
				this.#navigate('/');
			});
			page = Pages.HOME;
		} else if (Object.values(Pages).includes(hash as Pages)) {
			page = hash as Pages;
		} else {
			page = Pages.HOME;
		}

		return {
			page,
			pgp: {
				fingerprint: this.#internalFingerprint,
				keyParam: this.#internalKeyParam,
				mode: this.#internalMode
			}
		};
	});

	/**
	 * Internal navigation method using hash
	 * @param path - App-relative path (e.g., "/Guide")
	 */
	#navigate(path: string) {
		// Ensure path starts with /
		const hashPath = path.startsWith('/') ? path : '/' + path;
		window.location.hash = hashPath;
		this.#raw.hash = window.location.hash;
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
}

export const router = new Router();
