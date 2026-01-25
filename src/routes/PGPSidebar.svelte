<script lang="ts">
	import KeyList from '../lib/pgp/KeyList.svelte';
	import PlusIcon from '../lib/ui/icons/PlusIcon.svelte';
	import KeyIcon from '../lib/ui/icons/KeyIcon.svelte';
	import { keyStore, PersistenceType, type KeyWrapper } from '../lib/pgp/keyStore.svelte';
	import { router, Pages } from './router.svelte';

	let { selectedKeyWrapper = $bindable(null) }: { selectedKeyWrapper: KeyWrapper | null } =
		$props();

	let isMobileMenuOpen = false;

	const toggleMobileMenu = () => (isMobileMenuOpen = !isMobileMenuOpen);
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
	<div class="md:hidden fixed inset-0 bg-black/50 z-30" onclick={toggleMobileMenu} />
{/if}

<aside
	aria-label="Sidebar"
	class="{isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'}
    md:flex md:static h-full flex-col bg-base-200 w-full"
>
	<div>
		<KeyList keys={keyStore.keys} bind:selectedWrapper={selectedKeyWrapper} />
	</div>

	<div class="p-4 border-b border-primary/10 space-y-4">
		<button
			class="btn btn-primary w-full"
			onclick={() => {
				selectedKeyWrapper = null;
				router.openPage(Pages.HOME);
			}}
		>
			<PlusIcon className="h-5 w-5 mr-2" />
			Import Key
		</button>

		<button
			class="btn btn-outline w-full"
			onclick={() => {
				selectedKeyWrapper = null;
				isMobileMenuOpen = false;
				router.openPage(Pages.GENERATE_KEY);
			}}
		>
			<KeyIcon className="h-5 w-5 mr-2" />
			Generate Private Key
		</button>
	</div>
	<div class="p-4 border-t border-primary/10">
		<div>Getting Started</div>
		<div class="card card-border border-base-300 bg-base-100">
			<div class="card-body">
				<p>
					<strong>How it works:</strong> Type message to encrypt, or paste encrypted text to decrypt.
				</p>
				<a href="/Guide">Learn More</a>
			</div>
		</div>
	</div>

	<div class="p-4 border-t border-primary/10">
		<div class="card card-border border-base-300 bg-base-100">
			<div class="card-body">
				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-2">
						<input
							type="checkbox"
							class="toggle toggle-sm"
							checked={keyStore.shouldPersistByDefault}
							onchange={(e) => {
								keyStore.setPersistDefault(e.currentTarget.checked);
							}}
						/>
						<span class="label-text text-sm">Persist new keys</span>
					</label>
				</div>

				{#if !keyStore.shouldPersistByDefault && keyStore.keys.some((k) => k.persisted === PersistenceType.LOCAL_STORAGE)}
					<button class="btn btn-xs btn-error btn-outline w-full mt-2"> Clear Saved Data </button>
				{/if}
			</div>
		</div>
	</div>
</aside>
