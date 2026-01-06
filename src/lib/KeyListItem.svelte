<script lang="ts">
	import { keyStore } from './keyStore.svelte.js';
	import MiniActionButton from './MiniActionButton.svelte';
	import TrashIcon from './icons/TrashIcon.svelte';
	import type { Key } from 'openpgp';

	let { key, isSelected } = $props<{ key: Key; isSelected: boolean }>();

	let name = $state('Loading...');
	let email = $state('');

	$effect(() => {
		const user = key.getUserIDs()[0] || 'Unknown';
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
		if (confirm(`Are you sure you want to delete the key for ${name}?`)) {
			keyStore.deleteKey(key.getFingerprint());
		}
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

	<MiniActionButton label="Delete key" onclick={handleDelete} feedback="Deleted!">
		<TrashIcon />
	</MiniActionButton>
</div>
