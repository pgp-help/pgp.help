<script lang="ts">
	import { getKeyDetails } from './pgp';
	import CopyableTextarea from '../ui/CopyableTextarea.svelte';
	import type { Key } from 'openpgp';

	let {
		value = $bindable(''),
		label = 'PGP Key',
		placeholder = 'Paste PGP Key (Armored)...',
		onKeyParsed
	} = $props<{
		value?: string;
		label?: string;
		placeholder?: string;
		onKeyParsed?: (key: Key) => void;
	}>();

	let error = $state('');

	$effect(() => {
		const k = value;
		if (!k) {
			error = '';
			return;
		}

		getKeyDetails(k)
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
