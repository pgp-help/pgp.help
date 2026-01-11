import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => ({
	base: '/',
	plugins: [
		svelte(),
		// Use different HTML based on mode
		{
			name: 'html-transform',
			transformIndexHtml: {
				order: 'pre',
				handler() {
					if (mode === 'development') {
						// Use dev HTML in development
						return readFileSync('./index.dev.html', 'utf-8');
					}
					// Use index.html in production (default behavior)
					return undefined;
				}
			}
		}
	],
	resolve: {
		conditions: ['browser']
	},
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: './src/setupTests.ts'
	}
}));
