<script lang="ts">
	import KeyList from '../lib/pgp/KeyList.svelte';
	import PGPWorkflow from '../lib/pgp/PGPWorkflow.svelte';
	import GenerateKey from '../lib/pgp/GenerateKey.svelte';
	import { keyStore, type KeyWrapper } from '../lib/pgp/keyStore.svelte.js';
	import { router, Pages } from '../lib/router.svelte.js';
	import type { Key } from 'openpgp';
	import { fade } from 'svelte/transition';
	import PlusIcon from '../lib/ui/icons/PlusIcon.svelte';
	import KeyIcon from '../lib/ui/icons/KeyIcon.svelte';

	let selectedKeyWrapper = $state<KeyWrapper | null>(null);
	let isMobileMenuOpen = $state(false);
	let isGenerateKeyPage = $derived(router.activeRoute.page === Pages.GENERATE_KEY);
	let keyValue = $state<string>('');

	$effect(() => {
		// Access selectedKeyWrapper to register it as a dependency so the menu closes when it changes
		void selectedKeyWrapper;
		isMobileMenuOpen = false;
	});

	$effect(() => {
		const keyParam = router.activeRoute.pgp.keyParam;
		const selectedFingerprint = router.activeRoute.pgp.fingerprint;

		if (keyParam) {
			keyValue = keyParam;
		} else if (keyStore.isLoaded && selectedFingerprint) {
			const wrapper = keyStore.getKey(selectedFingerprint);
			if (wrapper) {
				selectedKeyWrapper = wrapper;
			} else {
				// Fingerprint not found in store, navigate home
				console.warn('Fingerprint not found in store, navigating home:', selectedFingerprint);
				router.openHome();
			}
		} else if (!selectedFingerprint) {
			selectedKeyWrapper = null;
		}
	});

	function handleNewKey(key: Key) {
		const fp = key.getFingerprint();
		keyStore.addKey(key).then(() => {
			const wrapper = keyStore.getKey(fp);
			selectedKeyWrapper = wrapper;
		});
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

<aside
	aria-label="Sidebar"
	class="{isMobileMenuOpen
		? 'fixed inset-y-0 left-0 z-40 flex'
		: 'hidden'} md:flex md:static h-full flex-col bg-base-100 border-r border-base-300 w-64 transition-transform"
>
	<div class="p-4 border-b border-base-300 space-y-2">
		<button
			class="btn btn-primary w-full"
			onclick={() => {
				selectedKeyWrapper = null;
			}}
		>
			<PlusIcon className="h-5 w-5 mr-2" />
			Import Key
		</button>
		<button
			class="btn btn-outline w-full"
			onclick={() => {
				router.openPage(Pages.GENERATE_KEY);
				isMobileMenuOpen = false;
			}}
		>
			<KeyIcon className="h-5 w-5 mr-2" />
			Generate Private Key
		</button>
	</div>

	<KeyList keys={keyStore.keys} bind:selectedWrapper={selectedKeyWrapper} />

	<div class="p-4 border-t border-base-300">
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={keyStore.shouldPersistByDefault}
				/>
				<span class="label-text text-sm">Persist new keys</span>
			</label>
		</div>
	</div>
</aside>

<main class="flex-1 overflow-y-auto p-4 sm:p-8" aria-label="PGP Workflow">
	{#if isGenerateKeyPage}
		<GenerateKey onKeyGenerated={handleNewKey} onCancel={() => router.openHome()} />
	{:else}
		<PGPWorkflow bind:keyWrapper={selectedKeyWrapper} onKeyParsed={handleNewKey} {keyValue} />
	{/if}
</main>
