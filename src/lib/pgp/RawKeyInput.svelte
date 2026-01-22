<script lang="ts">
	import { parseKey, type CryptoKey } from './keyStore.svelte.js';
	import CopyableTextarea from '../ui/CopyableTextarea.svelte';

	let {
		value = $bindable(''),
		label = 'Key',
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

<CopyableTextarea
	bind:value
	{label}
	{placeholder}
	readonly={false}
	selectAllOnFocus={false}
	{error}
	buttons={false}
/>
