// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Transforms production CSP to development CSP by adding directives needed for Vite HMR.
 * Adds 'unsafe-eval' to script-src and 'unsafe-inline' to style-src.
 */
function relaxCspForDev(html: string): string {
	return html.replace(
		/(<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]*)(")/i,
		(_match, prefix, csp, suffix) => {
			// Add 'unsafe-eval' to script-src (for Vite HMR)
			let devCsp = csp.replace(/script-src ([^;]*)/, "script-src $1 'unsafe-eval'");

			// Add 'unsafe-inline' to style-src (for Vite HMR)
			devCsp = devCsp.replace(/style-src ([^;]*)/, "style-src $1 'unsafe-inline'");

			return prefix + devCsp + suffix;
		}
	);
}

export default defineConfig(({ mode }) => {
	const plugins: Plugin[] = [...svelte()];

	if (mode === 'development') {
		// In dev mode we need to relax csp to allow Vite HMR to work
		plugins.push({
			name: 'csp-dev-transform',
			transformIndexHtml(html) {
				return relaxCspForDev(html);
			}
		});
	}

	return {
		base: '/pgp.svelte/',
		plugins,
		resolve: {
			conditions: ['browser']
		},
		test: {
			environment: 'happy-dom',
			globals: true,
			setupFiles: './src/setupTests.ts'
		}
	};
});
