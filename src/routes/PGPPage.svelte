<script lang="ts">
	import PGPWorkflow from '../lib/pgp/PGPWorkflow.svelte';
	import GenerateKey from '../lib/pgp/GenerateKey.svelte';
	import { keyStore, type KeyWrapper, PersistenceType } from '../lib/pgp/keyStore.svelte';
	import { router, Pages } from './router.svelte';
	import WarningIcon from '../lib/ui/icons/WarningIcon.svelte';
	import { type CryptoKey } from '../lib/pgp/crypto';

	let { selectedKeyWrapper = $bindable(null) }: { selectedKeyWrapper: KeyWrapper | null } =
		$props();

	let isGenerateKeyPage = $derived(router.activeRoute.page === Pages.GENERATE_KEY);
	let keyValue = $state<string>('');

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
				router.openHome();
			}
		} else if (!selectedFingerprint) {
			selectedKeyWrapper = null;
		}
	});

	function handleNewKey(key: CryptoKey) {
		keyStore.addKey({ key, persisted: PersistenceType.DEFAULT }).then(() => {
			router.openKey(key);
		});
	}

	let clearDataDialog: HTMLDialogElement;
	function clearData() {
		keyStore.clearPersistedKeys();
		clearDataDialog.close();
	}
</script>

<main class="flex-1 overflow-y-auto p-4 sm:p-8" aria-label="PGP Workflow">
	{#if isGenerateKeyPage}
		<GenerateKey onKeyGenerated={handleNewKey} onCancel={() => router.openHome()} />
	{:else}
		<PGPWorkflow bind:keyWrapper={selectedKeyWrapper} onKeyParsed={handleNewKey} {keyValue} />
	{/if}
</main>

<dialog bind:this={clearDataDialog} class="modal" onclick={(e) => e.stopPropagation()}>
	<div class="modal-box text-base-content cursor-default">
		<h3 class="font-bold text-lg">Clear Saved Data?</h3>
		<p class="py-4">
			You have turned off "Persist new keys", but you still have keys saved in your browser storage.
			Do you want to clear them now?
		</p>

		<div role="alert" class="alert alert-warning mb-4">
			<WarningIcon />
			<span>
				Warning: This will remove all keys saved in this browser. Make sure you have backups of any
				important keys!
			</span>
		</div>

		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Keep Data</button>
			</form>
			<button class="btn btn-error" onclick={clearData}>Clear Data</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
