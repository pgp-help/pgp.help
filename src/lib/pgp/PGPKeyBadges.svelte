<script lang="ts">
	import type { KeyWrapper } from './keyStore.svelte.js';

	let { keyWrapper } = $props<{
		keyWrapper: KeyWrapper;
	}>();

	let key = $derived(keyWrapper.key);
	let isPersisted = $derived(keyWrapper.isPersisted);
	let hasNoPassword = $derived(keyWrapper.hasNoPassword);
</script>

<div class="flex gap-1 shrink-0">
	<span class="badge {key.isPrivate() ? 'badge-secondary' : 'badge-primary'} badge-sm">
		{key.isPrivate() ? 'Private' : 'Public'}
	</span>
	{#if !isPersisted}
		<span class="badge badge-sm badge-warning" title="Not Persisted (Asset)">Unsaved</span>
	{/if}
	{#if key.isPrivate()}
		{#if hasNoPassword}
			<span class="badge badge-success badge-sm">No Password</span>
		{:else if key.isDecrypted()}
			<span class="badge badge-success badge-sm">Unlocked</span>
		{/if}
	{/if}
</div>
