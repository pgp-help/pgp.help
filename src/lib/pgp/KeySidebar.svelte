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

<!-- Mobile FAB -->
<div class="md:hidden fab">
	<!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
	<div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">
		<!-- Menu icon (keys) -->

		<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16M4 18h16"
			/>
		</svg>
	</div>

	<!-- close button should not be focusable so it can close the FAB when clicked. It's just a visual placeholder -->
	<div class="fab-close">
		Close <span class="btn btn-circle btn-lg btn-primary">✕</span>
	</div>

	<!-- Dim backdrop for mobile when menu is open -->
	<div class="md:hidden fixed inset-0 bg-black/50 z-300" transition:slide={{ duration: 200 }}></div>
</div>

<!-- Sidebar -->
<div class="hidden md:flex h-full flex flex-col bg-base-100 border-r border-base-300 w-64">
	<div class="p-4 border-b border-base-300 space-y-2">
		<button
			class="btn btn-primary w-full"
			onclick={() => {
				router.openPage(Pages.HOME);
			}}
		>
			<PlusIcon className="h-5 w-5 mr-2" />
			Import Key
		</button>
		<button
			class="btn btn-outline w-full"
			onclick={() => {
				router.openPage(Pages.GENERATE_KEY);
			}}
		>
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
