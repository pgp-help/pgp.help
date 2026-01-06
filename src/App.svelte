<script lang="ts">
	import Layout from './Layout.svelte';
	import Home from './routes/Home.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, navigate } from './lib/router.svelte.js';
	import { keyStore } from './lib/keyStore.svelte.js';
	import type { Key } from 'openpgp';

	let currentKey = $state('');

	$effect(() => {
		const params = new URLSearchParams(router.search);
		const fp = params.get('fingerprint');
		const keyParam = params.get('key');

		if (fp) {
			const stored = keyStore.getKey(fp);
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
				const url = new URL(window.location.href);
				if (url.searchParams.get('fingerprint') !== fp) {
					url.searchParams.delete('key');
					url.searchParams.set('fingerprint', fp);
					navigate(url.pathname + url.search);
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
