<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import KeyListItem from './KeyListItem.svelte';
	import { router, Pages } from '../router.svelte.js';
	import { slide, fade } from 'svelte/transition';
	import PlusIcon from '../ui/icons/PlusIcon.svelte';
	import KeyIcon from '../ui/icons/KeyIcon.svelte';

	let selectedFingerprint = $derived(router.activeRoute.pgp.fingerprint);
	let isMobileMenuOpen = $state(false);

	function handleSelectKey(fingerprint: string) {
		router.openKey(fingerprint);
		isMobileMenuOpen = false;
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
</script>

<!-- Mobile FAB -->
<div class="md:hidden fixed bottom-6 right-6 z-50">
	<button class="btn btn-lg btn-circle btn-primary" onclick={toggleMobileMenu}>
		{#if isMobileMenuOpen}
			<span class="text-xl">✕</span>
		{:else}
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		{/if}
	</button>
</div>

{#if isMobileMenuOpen}
	<!-- Dim backdrop for mobile when menu is open -->
	<div
		class="md:hidden fixed inset-0 bg-black/50 z-30"
		transition:fade={{ duration: 200 }}
		onclick={toggleMobileMenu}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape') toggleMobileMenu();
		}}
	></div>
{/if}

<!-- Sidebar -->
<div
	class="{isMobileMenuOpen
		? 'fixed inset-y-0 left-0 z-40 flex'
		: 'hidden'} md:flex md:static h-full flex-col bg-base-100 border-r border-base-300 w-64 transition-transform"
>
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
		{#each keyStore.keys as wrapper (wrapper.key.getFingerprint())}
			<div class="flex flex-col" transition:slide={{ duration: 200 }}>
				<div
					class="group"
					role="link"
					tabindex="0"
					onclick={() => handleSelectKey(wrapper.key.getFingerprint())}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleSelectKey(wrapper.key.getFingerprint());
						}
					}}
				>
					<KeyListItem
						keyWrapper={wrapper}
						isSelected={selectedFingerprint === wrapper.key.getFingerprint()}
					/>
				</div>
			</div>
		{/each}
	</div>
	<div class="p-4 border-t border-base-300">
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					checked={keyStore.shouldPersistByDefault}
					onchange={(e) => keyStore.setPersistDefault(e.currentTarget.checked)}
				/>
				<span class="label-text text-sm">Persist new keys</span>
			</label>
		</div>
	</div>
</div>
