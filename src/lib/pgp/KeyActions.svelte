<script lang="ts">
	import { keyStore, type KeyWrapper, PersistenceType } from './keyStore.svelte.js';
	import { router } from '../../routes/router.svelte';
	import SaveIcon from '../ui/icons/SaveIcon.svelte';
	import TrashIcon from '../ui/icons/TrashIcon.svelte';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';

	let { keyWrapper, class: className = '' } = $props<{
		keyWrapper: KeyWrapper;
		class?: string;
	}>();

	let deleteDialog: HTMLDialogElement;

	function handleSave(e: Event) {
		e.stopPropagation();
		keyWrapper.persisted = PersistenceType.LOCAL_STORAGE;
		keyStore.addKey(keyWrapper);
	}

	function handleDelete(e: Event) {
		e.stopPropagation();
		deleteDialog.showModal();
	}

	function confirmDelete() {
		keyStore.deleteKey(keyWrapper.key.getFingerprint());
		deleteDialog.close();
		router.openHome();
	}

	function getKeyName(wrapper: KeyWrapper) {
		const user = wrapper.key.getUserIDs()[0] || '<Unknown>';
		return user;
	}

	const tooltipClasses = '';
	const buttonClasses = 'btn-mini';
</script>

<div
	class="flex items-center gap-1 {className} overflow-visible"
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => e.stopPropagation()}
	onkeyup={(e) => e.stopPropagation()}
	tabindex="-1"
	role="group"
>
	{#if keyWrapper.persisted === PersistenceType.MEMORY}
		<div class="tooltip ${tooltipClasses}" data-tip="Save key">
			<button type="button" class="${buttonClasses}" onclick={handleSave} aria-label="Save key">
				<SaveIcon />
			</button>
		</div>
	{:else}
		<div class="tooltip ${tooltipClasses}" data-tip="Delete key">
			<button type="button" class="${buttonClasses}" onclick={handleDelete} aria-label="Delete key">
				<TrashIcon />
			</button>
		</div>
	{/if}
</div>

<dialog bind:this={deleteDialog} class="modal" onclick={(e) => e.stopPropagation()}>
	<div class="modal-box text-base-content cursor-default">
		<h3 class="font-bold text-lg">Delete Key</h3>
		<p class="py-4">
			Are you sure you want to delete the key for <span class="font-semibold"
				>{getKeyName(keyWrapper)}</span
			>?
		</p>

		{#if keyWrapper.key.isPrivate()}
			<div role="alert" class="alert alert-warning mb-4">
				<WarningIcon />
				<span>
					Warning: This is a private key. The data CANNOT be recovered unless YOU have a backup.
				</span>
			</div>
		{/if}

		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Cancel</button>
			</form>
			<button class="btn btn-error" onclick={confirmDelete}>Delete</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
