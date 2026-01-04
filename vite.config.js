import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		// Using happy-dom instead of jsdom for significantly faster startup times
		// while still providing sufficient DOM simulation for most Svelte tests.
		environment: 'happy-dom',
		globals: true,
		setupFiles: './src/setupTests.ts'
	}
});
