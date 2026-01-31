<script lang="ts">
	import { keyStore, type KeyWrapper, PersistenceType } from './keyStore.svelte.js';
	import { router } from '../../routes/router.svelte';

	import SaveIcon from '../ui/icons/SaveIcon.svelte';
	import TrashIcon from '../ui/icons/TrashIcon.svelte';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';
	import CopyButtons from '../ui/CopyButtons.svelte';

	let { keyWrapper } = $props<{
		keyWrapper: KeyWrapper;
	}>();

	let deleteDialog: HTMLDialogElement;

	function handleSave(e: MouseEvent) {
		e.stopPropagation(); // Prevents row selection
		keyWrapper.persisted = PersistenceType.LOCAL_STORAGE;
		keyStore.addKey(keyWrapper);
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation(); // Prevents row selection
		deleteDialog.showModal();
	}

	function confirmDelete() {
		if (keyWrapper?.key) {
			keyStore.deleteKey(keyWrapper.key.getFingerprint());
		}
		deleteDialog.close();
		router.openHome();
	}

	function getKeyName(wrapper: KeyWrapper) {
		return wrapper.key.getUserIDs()[0] || '<Unknown>';
	}
</script>

<!-- 
	Fix: Removed onclick={stopProp} and role="toolbar". 
	This is just a layout wrapper now. 
	Clicking the gap between buttons will act as clicking the parent row (Standard UX).
-->
<div class="flex items-center gap-2 overflow-visible">
	{#if keyWrapper.persisted === PersistenceType.MEMORY}
		<button type="button" class="btn btn-ghost btn-sm text-primary" onclick={handleSave}>
			<SaveIcon class="w-4 h-4" />
			<span>Save</span>
		</button>
	{:else}
		<button type="button" class="btn btn-ghost btn-sm text-error" onclick={handleDelete}>
			<TrashIcon class="w-4 h-4" />
			<span>Delete</span>
		</button>
	{/if}

	<CopyButtons value={keyWrapper.key.toPublic().getArmor()} showLink={true} />
</div>

<!-- Modal remains mostly the same, just handling click bubbling on the modal itself -->
<dialog bind:this={deleteDialog} class="modal" onclick={(e) => e.stopPropagation()}>
	<div class="modal-box text-base-content">
		<h3 class="font-bold text-lg">Delete Key</h3>
		<p class="py-4">
			Are you sure you want to delete the key for <span class="font-semibold text-primary">
				{keyWrapper ? getKeyName(keyWrapper) : 'Unknown'}
			</span>?
		</p>

		{#if keyWrapper?.key?.isPrivate()}
			<div role="alert" class="alert alert-warning mb-4">
				<WarningIcon class="w-6 h-6" />
				<span class="text-sm">
					Warning: This is a private key. The data CANNOT be recovered unless YOU have a backup.
				</span>
			</div>
		{/if}

		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-ghost">Cancel</button>
			</form>
			<button class="btn btn-error text-white" onclick={confirmDelete}>Delete</button>
		</div>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
