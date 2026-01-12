<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import KeyListItem from './KeyListItem.svelte';
	import { router, Pages } from '../router.svelte.js';
	import { slide } from 'svelte/transition';
	import PlusIcon from '../ui/icons/PlusIcon.svelte';
	import KeyIcon from '../ui/icons/KeyIcon.svelte';

	let selectedFingerprint = $derived(router.activeRoute.pgp.fingerprint);

	function handleSelectKey(fingerprint: string) {
		router.openKey(fingerprint);
	}
</script>

<div class="h-full flex flex-col bg-base-100 border-r border-base-300 w-64">
	<div class="p-4 border-b border-base-300 space-y-2">
		<button class="btn btn-primary w-full" onclick={() => router.openPage(Pages.HOME)}>
			<PlusIcon className="h-5 w-5 mr-2" />
			Import Key
		</button>
		<button class="btn btn-outline w-full" onclick={() => router.openPage(Pages.GENERATE_KEY)}>
			<KeyIcon className="h-5 w-5 mr-2" />
			Generate Private Key
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-2 space-y-1">
		{#if keyStore.keys.length === 0}
			<div class="text-center p-4 text-base-content/50 text-sm">
				No keys found. Create or import one to get started.
			</div>
		{/if}
		{#each keyStore.keys as key (key.getFingerprint())}
			<div class="flex flex-col" transition:slide={{ duration: 200 }}>
				<div
					class="group"
					role="link"
					tabindex="0"
					onclick={() => handleSelectKey(key.getFingerprint())}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleSelectKey(key.getFingerprint());
						}
					}}
				>
					<KeyListItem {key} isSelected={selectedFingerprint === key.getFingerprint()} />
				</div>
			</div>
		{/each}
	</div>
</div>
