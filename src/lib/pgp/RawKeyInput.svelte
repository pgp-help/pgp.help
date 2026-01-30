<script lang="ts">
	import { parseKey, type CryptoKey } from './keyStore.svelte.js';

	import CardWithHeader from '../ui/CardWithHeader.svelte';

	let {
		value = $bindable(''),
		label = 'Import Key',
		placeholder = 'Paste PGP or AGE Key...',
		onKeyParsed
	} = $props<{
		value?: string;
		label?: string;
		placeholder?: string;
		onKeyParsed?: (key: CryptoKey) => void;
	}>();

	let error = $state('');

	$effect(() => {
		const k = value;
		if (!k) {
			error = '';
			return;
		}

		parseKey(k)
			.then(async (details) => {
				onKeyParsed?.(details);
			})
			.catch((err) => {
				if (value === k) {
					error = err.message;
				}
			});
	});
</script>

<CardWithHeader title={label} {error}>
	{#snippet children({ uid })}
		<textarea
			id={uid}
			bind:value
			aria-label={label}
			class="textarea textarea-ghost h-32 w-full resize-y border-none focus:outline-none focus:bg-transparent"
			{placeholder}
		></textarea>
	{/snippet}
</CardWithHeader>
