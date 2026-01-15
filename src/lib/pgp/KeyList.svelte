<script lang="ts">
	import { slide } from 'svelte/transition';
	import { keyStore, type KeyWrapper } from './keyStore.svelte.js';
	import TrashIcon from '../ui/icons/TrashIcon.svelte';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';
	import PGPKeyBadges from './PGPKeyBadges.svelte';

	interface Props {
		keys: KeyWrapper[];
		selectedWrapper?: KeyWrapper | null;
	}

	let { keys, selectedWrapper = $bindable() }: Props = $props();

	let keyToDelete = $state<KeyWrapper | null>(null);
	let deleteDialog: HTMLDialogElement;

	function handleDelete(wrapper: KeyWrapper, e: Event) {
		e.stopPropagation();
		keyToDelete = wrapper;
		deleteDialog.showModal();
	}

	function confirmDelete() {
		if (keyToDelete) {
			keyStore.deleteKey(keyToDelete.key.getFingerprint());
			keyToDelete = null;
		}
		deleteDialog.close();
	}

	function getKeyName(wrapper: KeyWrapper) {
		const user = wrapper.key.getUserIDs()[0] || '<Unknown>';
		const match = user.match(/^(.*?)(?:\s+<([^>]+)>)?$/);
		return match ? match[1].trim() : user;
	}

	function getKeyEmail(wrapper: KeyWrapper) {
		const user = wrapper.key.getUserIDs()[0] || '<Unknown>';
		const match = user.match(/^(.*?)(?:\s+<([^>]+)>)?$/);
		return match && match[2] ? match[2].trim() : '';
	}
</script>

<div class="flex-1 overflow-y-auto p-2 space-y-1">
	{#if keys.length === 0}
		<div class="text-center p-4 text-base-content/50 text-sm">
			No keys found. Create or import one to get started.
		</div>
	{/if}
	{#each keys as wrapper (wrapper.key.getFingerprint())}
		{@const isSelected = selectedWrapper?.key.getFingerprint() === wrapper.key.getFingerprint()}
		{@const name = getKeyName(wrapper)}
		{@const email = getKeyEmail(wrapper)}

		<div class="flex flex-col" transition:slide={{ duration: 200 }}>
			<div
				class="group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors {isSelected
					? 'bg-base-200 border-l-4 border-primary'
					: ''}"
				role="link"
				tabindex="0"
				onclick={() => {
					// If the key is already selected this will effectively switch to the cannonical verion
					// (i.e. if the user is looking at the public key view of a private key, this will switch to the private key view)
					// This is ok.
					selectedWrapper = wrapper;
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						selectedWrapper = wrapper;
					}
				}}
			>
				<div class="flex-1 min-w-0 mr-2">
					<div class="flex items-center gap-2">
						<span class="font-medium truncate text-sm" title={name}>{name}</span>
						<PGPKeyBadges keyWrapper={wrapper} />
					</div>
					{#if email}
						<div class="text-xs text-base-content/70 truncate" title={email}>{email}</div>
					{/if}
				</div>

				<button
					type="button"
					class="btn-mini opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
					onclick={(e) => handleDelete(wrapper, e)}
					aria-label="Delete key"
					title="Delete key"
				>
					<TrashIcon />
				</button>
			</div>
		</div>
	{/each}
</div>

<dialog bind:this={deleteDialog} class="modal" onclick={(e) => e.stopPropagation()}>
	<div class="modal-box text-base-content cursor-default">
		<h3 class="font-bold text-lg">Delete Key</h3>
		<p class="py-4">
			Are you sure you want to delete the key for <span class="font-semibold"
				>{keyToDelete ? getKeyName(keyToDelete) : ''}</span
			>?
		</p>

		{#if keyToDelete?.key.isPrivate()}
			<div role="alert" class="alert alert-warning mb-4">
				<WarningIcon />
				<span>
					Warning: This is a private key. The data CANNOT be recovered unless YOU have a backup.
				</span>
			</div>
		{/if}

		<div class="modal-action">
			<form method="dialog">
				<!-- if there is a button in form, it will close the modal -->
				<button class="btn">Cancel</button>
			</form>
			<button class="btn btn-error" onclick={confirmDelete}>Delete</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
