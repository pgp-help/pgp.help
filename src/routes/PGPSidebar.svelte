<script lang="ts">
	import KeyList from '../lib/pgp/KeyList.svelte';
	import PlusIcon from '../lib/ui/icons/PlusIcon.svelte';
	import KeyIcon from '../lib/ui/icons/KeyIcon.svelte';
	import { keyStore, PersistenceType, type KeyWrapper } from '../lib/pgp/keyStore.svelte';
	import { router, Pages } from './router.svelte';
	import WarningIcon from '../lib/ui/icons/WarningIcon.svelte';

	let {
		selectedKeyWrapper = $bindable(null),
		onCloseMobileMenu
	}: { selectedKeyWrapper: KeyWrapper | null; onCloseMobileMenu?: () => void } = $props();

	let clearDataDialog: HTMLDialogElement;
	function clearData() {
		keyStore.clearPersistedKeys();
		clearDataDialog.close();
	}

	function handleKeySelect(wrapper: KeyWrapper) {
		selectedKeyWrapper = wrapper;
		router.openKey(wrapper.key);
		onCloseMobileMenu?.();
	}

	function handleImportKey() {
		selectedKeyWrapper = null;
		router.openPage(Pages.HOME);
		onCloseMobileMenu?.();
	}

	function handleGenerateKey() {
		selectedKeyWrapper = null;
		router.openPage(Pages.GENERATE_KEY);
		onCloseMobileMenu?.();
	}

	function handleLearnMore() {
		router.openPage(Pages.GUIDE);
		onCloseMobileMenu?.();
	}
</script>

<aside aria-label="Sidebar" class="h-full flex flex-col bg-base-200 w-full">
	<div>
		<KeyList
			keys={keyStore.keys}
			bind:selectedWrapper={selectedKeyWrapper}
			onKeySelect={handleKeySelect}
		/>
	</div>

	<div class="p-4 border-b border-primary/10 space-y-4">
		<button class="btn btn-primary w-full" onclick={handleImportKey}>
			<PlusIcon className="h-5 w-5 mr-2" />
			Import Key
		</button>

		<button class="btn btn-outline w-full" onclick={handleGenerateKey}>
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
				<button class="btn btn-link p-0 h-auto min-h-0 text-primary" onclick={handleLearnMore}>
					Learn More
				</button>
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
					<button
						class="btn btn-xs btn-error btn-outline w-full mt-2"
						onclick={() => clearDataDialog.showModal()}
					>
						Clear Saved Data
					</button>
				{/if}
			</div>
		</div>
	</div>
</aside>

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
