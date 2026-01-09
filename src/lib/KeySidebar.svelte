<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import KeyListItem from './KeyListItem.svelte';
	import { navigate, parsePath, buildPath } from './router.svelte.js';

	let selectedFingerprint = $derived.by(() => {
		const { fingerprint, keyParam } = parsePath();
		return fingerprint || keyParam;
	});

	function handleNavigation(e: Event, fingerprint?: string | null, mode?: string) {
		e.preventDefault();
		const { basePath } = parsePath();

		if (fingerprint) {
			// Generate path-based URL for fingerprint, clearing key param
			const newUrl = buildPath({
				basePath,
				fingerprint,
				mode,
				clearKey: true,
				clearMode: !mode // Clear mode if not specified
			});
			navigate(newUrl);
		} else {
			// Navigate to base path without fingerprint, clearing all params
			const newUrl = buildPath({
				basePath,
				clearKey: true,
				clearMode: true,
				clearFingerprint: true
			});
			navigate(newUrl);
		}
	}
</script>

<div class="h-full flex flex-col bg-base-100 border-r border-base-300 w-64">
	<div class="p-4 border-b border-base-300">
		<button class="btn btn-primary w-full" onclick={(e) => handleNavigation(e)}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-2"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Key
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-2 space-y-1">
		{#if keyStore.keys.length === 0}
			<div class="text-center p-4 text-base-content/50 text-sm">
				No keys found. Create or import one to get started.
			</div>
		{/if}
		{#each keyStore.keys as key (key.getFingerprint())}
			<div class="flex flex-col">
				<a
					href="/pgp.svelte/{key.getFingerprint()}"
					class="block group"
					onclick={(e) => handleNavigation(e, key.getFingerprint())}
				>
					<KeyListItem {key} isSelected={selectedFingerprint === key.getFingerprint()} />
				</a>
			</div>
		{/each}
	</div>
</div>
