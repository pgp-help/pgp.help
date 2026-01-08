<script lang="ts">
	import Layout from './Layout.svelte';
	import Home from './routes/Home.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, navigate, parsePath, buildPath } from './lib/router.svelte.js';
	import { keyStore } from './lib/keyStore.svelte.js';
	import { PGPMode, type PGPModeType } from './lib/types.js';
	import type { Key } from 'openpgp';

	let currentKey = $state('');
	let currentMode = $state<PGPModeType>(PGPMode.ENCRYPT);

	$effect(() => {
		const { fingerprint, keyParam, mode } = parsePath();
		currentMode = mode as PGPModeType;

		if (fingerprint) {
			// Fetch key by fingerprint only - mode will determine how it's used
			const stored = keyStore.getKey(fingerprint);
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
				const { basePath, fingerprint: currentFp, mode, search } = parsePath();

				if (currentFp !== fp) {
					// Determine the appropriate mode for the new key
					let targetMode = mode;

					// If no explicit mode was set in the URL and this is a private key,
					// default to decrypt mode for better UX
					if (!search.includes('mode=') && keyObject.isPrivate()) {
						targetMode = PGPMode.DECRYPT;
					}

					// Generate path-based URL for fingerprint, clearing key param
					const newUrl = buildPath({ basePath, fingerprint: fp, mode: targetMode, clearKey: true });
					navigate(newUrl);
				}
			});
		}
	}

	function handleModeChange(newMode: PGPModeType) {
		const { basePath, fingerprint, keyParam } = parsePath();
		const newUrl = buildPath({
			basePath,
			fingerprint,
			keyParam,
			mode: newMode
		});
		navigate(newUrl);
	}
</script>

<Layout>
	{#if router.path === '/Guide'}
		<Guide />
	{:else}
		<Home
			initialKey={currentKey}
			onKeyChange={handleKeyChange}
			mode={currentMode}
			onModeChange={handleModeChange}
		/>
	{/if}
</Layout>
