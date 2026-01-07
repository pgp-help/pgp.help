<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import KeyListItem from './KeyListItem.svelte';
	import { navigate, router } from './router.svelte.js';

	let selectedFingerprint = $derived.by(() => {
		const params = new URLSearchParams(router.search);
		return params.get('fingerprint') || params.get('key');
	});

	function handleNavigation(e: Event, fingerprint?: string | null, mode?: string) {
		e.preventDefault();
		const url = new URL(window.location.href);
		url.searchParams.delete('key');

		if (fingerprint) {
			url.searchParams.set('fingerprint', fingerprint);
			if (mode) {
				url.searchParams.set('mode', mode);
			} else {
				url.searchParams.delete('mode');
			}
		} else {
			url.searchParams.delete('fingerprint');
			url.searchParams.delete('mode');
		}

		navigate(url.pathname + url.search);
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
					href="?fingerprint={key.getFingerprint()}"
					class="block group"
					onclick={(e) => handleNavigation(e, key.getFingerprint())}
				>
					<KeyListItem {key} isSelected={selectedFingerprint === key.getFingerprint()} />
				</a>
				{#if key.isPrivate()}
					<a
						href="?fingerprint={key.getFingerprint()}&mode=encrypt"
						class="text-xs px-2 pb-1 text-primary hover:underline text-right"
						onclick={(e) => handleNavigation(e, key.getFingerprint(), 'encrypt')}
					>
						Encrypt with public key
					</a>
				{/if}
			</div>
		{/each}
	</div>
</div>
