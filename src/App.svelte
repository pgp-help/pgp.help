<script lang="ts">
	import Layout from './Layout.svelte';
	import Home from './routes/Home.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, navigate, parsePath, buildPath } from './lib/router.svelte.js';
	import { keyStore } from './lib/keyStore.svelte.js';
	import type { Key } from 'openpgp';

	let currentKey = $state('');

	$effect(() => {
		const { fingerprint, keyParam, mode } = parsePath();
		if (fingerprint) {
			const stored = keyStore.getKey(fingerprint, mode === 'encrypt' ? 'public' : undefined);
			if (stored) {
				currentKey = stored.armor();
			}
		} else if (keyParam) {
			currentKey = keyParam;
		} else {
			currentKey = '';
		}
	});

	function handleKeyChange(keyObject: Key) {
		if (keyObject) {
			const fp = keyObject.getFingerprint();

			keyStore.addKey(keyObject).then(() => {
				// Once the key is saved, ensure the URL reflects it.
				// If we are not already viewing this key (by fingerprint), navigate to it.
				// This handles the "paste new key -> auto-save -> select" flow.
				const { basePath, fingerprint: currentFp, mode } = parsePath();

				if (currentFp !== fp) {
					// Generate path-based URL for fingerprint, clearing key param
					const newUrl = buildPath({ basePath, fingerprint: fp, mode, clearKey: true });
					navigate(newUrl);
				}
			});
		}
	}
</script>

<Layout>
	{#if router.path === '/Guide'}
		<Guide />
	{:else}
		<Home initialKey={currentKey} onKeyChange={handleKeyChange} />
	{/if}
</Layout>
