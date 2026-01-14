// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';
import path from 'node:path';

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

/**
 * Simulates GitHub Pages 404 handling in local development.
 *
 * Why: GitHub Pages serves 404.html for any unknown path. We use a custom 404.html
 * that handles client-side routing redirects (SPA fallback pattern).
 * To test this behavior locally without building and deploying, we need Vite to serve
 * 404.html instead of its default 404 page when a route is missing.
 *
 * How: This plugin uses the `configureServer` hook. By returning a function from this hook,
 * we register our middleware to run AFTER Vite's internal middlewares have tried to handle the request.
 * `server.middlewares.use` adds it to the end of the chain.
 */
function serve404(): Plugin {
	return {
		name: 'serve-404',
		configureServer(server) {
			return () => {
				server.middlewares.use(async (req, res, next) => {
					if (req.headers.accept?.includes('text/html')) {
						if (req.url !== '/index.html') {
							const htmlPath = path.resolve(process.cwd(), '404.html');
							console.log('[serve-404] Serving 404.html for:', req.url);
							if (fs.existsSync(htmlPath)) {
								let html = fs.readFileSync(htmlPath, 'utf-8');
								html = await server.transformIndexHtml(req.url || '/', html);
								res.statusCode = 404;
								res.setHeader('Content-Type', 'text/html');
								res.end(html);
								return;
							}
						}
					}
					next();
				});
			};
		}
	};
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
		plugins.push(serve404());
	}

	return {
		appType: 'mpa', // So we can 404.html as a separate page
		base: '/',
		plugins,
		resolve: {
			conditions: ['browser']
		},
		test: {
			environment: 'happy-dom',
			globals: true,
			setupFiles: './src/setupTests.ts'
		},
		build: {
			sourcemap: true // Generates .map files
		}
	};
});
