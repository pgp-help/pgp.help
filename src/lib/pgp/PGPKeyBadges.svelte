<script lang="ts">
	import { type KeyWrapper, PersistenceType } from './keyStore.svelte.js';

	let { keyWrapper } = $props<{
		keyWrapper: KeyWrapper;
	}>();

	let key = $derived(keyWrapper.key);
	let persisted = $derived(keyWrapper.persisted);
	let hasNoPassword = $derived(keyWrapper.hasNoPassword);
</script>

<div class="flex gap-1 shrink-0">
	<span class="badge {key.isPrivate() ? 'badge-primary' : 'badge-secondary'} badge-sm">
		{key.isPrivate() ? 'Private' : 'Public'}
	</span>
	{#if keyWrapper.masterKey}
		<span class="badge badge-primary badge-sm" title="Private key available">Private Avail.</span>
	{/if}
	{#if persisted === PersistenceType.MEMORY}
		<span class="badge badge-sm badge-warning" title="Unsaved">Unsaved</span>
	{/if}
	{#if persisted === PersistenceType.LEGACY}
		<span class="badge badge-sm badge-secondary" title="Legacy">Legacy</span>
	{/if}
	{#if key.isPrivate()}
		{#if hasNoPassword}
			<span class="badge badge-success badge-sm">No Password</span>
			<!--
		{:else if key.isDecrypted()}
			<span class="badge badge-success badge-sm">Unlocked</span>
		-->
		{/if}
	{/if}
</div>
