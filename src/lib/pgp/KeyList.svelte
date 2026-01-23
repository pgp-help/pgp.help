<script lang="ts">
	import { slide } from 'svelte/transition';
	import { type KeyWrapper } from './keyStore.svelte.js';
	import PGPKeyBadges from './PGPKeyBadges.svelte';

	interface Props {
		keys: KeyWrapper[];
		selectedWrapper?: KeyWrapper | null;
	}

	let { keys, selectedWrapper = $bindable() }: Props = $props();

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

	function getKeySubtitle(wrapper: KeyWrapper) {
		const email = getKeyEmail(wrapper);
		if (email) {
			return email;
		}
		return wrapper.key.getId();
	}
</script>

<div class="flex-1 p-2 space-y-1">
	{#if keys.length === 0}
		<div class="text-center p-4 text-base-content/50 text-sm">
			No keys found. Create or import one to get started.
		</div>
	{/if}
	{#each keys as wrapper (wrapper.key.getFingerprint())}
		{@const isSelected = selectedWrapper?.key.getFingerprint() === wrapper.key.getFingerprint()}
		{@const name = getKeyName(wrapper)}
		{@const email = getKeySubtitle(wrapper)}

		<div class="flex flex-col" transition:slide={{ duration: 200 }}>
			<div
				class="group/key-actions flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors {isSelected
					? 'emphasis-primary'
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
			</div>
		</div>
	{/each}
</div>
