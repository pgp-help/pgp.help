<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import MiniActionButton from '../ui/MiniActionButton.svelte';
	import TrashIcon from '../ui/icons/TrashIcon.svelte';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';
	import type { Key } from 'openpgp';

	let { key, isSelected } = $props<{ key: Key; isSelected: boolean }>();

	let name = $state('Loading...');
	let email = $state('');
	let dialog: HTMLDialogElement;

	$effect(() => {
		const user = key.getUserIDs()[0] || '<Unknown>';
		// Parse name and email from user ID
		// (.*?) => non-greedy match for name
		// (?:\s+<([^>]+)>)? => non-capturing group for optional email in angle brackets
		const match = user.match(/^(.*?)(?:\s+<([^>]+)>)?$/);
		if (match) {
			name = match[1].trim();
			email = match[2] ? match[2].trim() : '';
		} else {
			name = user;
			email = '';
		}
	});

	function handleDelete() {
		dialog.showModal();
	}

	function confirmDelete() {
		keyStore.deleteKey(key.getFingerprint());
		dialog.close();
	}
</script>

<div
	class="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors {isSelected
		? 'bg-base-200 border-l-4 border-primary'
		: ''}"
>
	<div class="flex-1 min-w-0 mr-2">
		<div class="flex items-center gap-2">
			<span class="font-medium truncate text-sm" title={name}>{name}</span>
			{#if key.isPrivate()}
				<span class="badge badge-xs badge-secondary" title="Private Key">Private Key</span>
			{:else}
				<span class="badge badge-xs badge-primary" title="Public Key">Public Key</span>
			{/if}
		</div>
		{#if email}
			<div class="text-xs text-base-content/70 truncate" title={email}>{email}</div>
		{/if}
	</div>

	<MiniActionButton label="Delete key" onclick={handleDelete} feedback="Delete key">
		<TrashIcon />
	</MiniActionButton>
</div>

<dialog bind:this={dialog} class="modal" onclick={(e) => e.stopPropagation()}>
	<div class="modal-box text-base-content cursor-default">
		<h3 class="font-bold text-lg">Delete Key</h3>
		<p class="py-4">
			Are you sure you want to delete the key for <span class="font-semibold">{name}</span>?
		</p>

		{#if key.isPrivate()}
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
