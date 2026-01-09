<script lang="ts">
	import { getKeyDetails, decryptPrivateKey } from './pgp';
	import CopyableTextarea from './CopyableTextarea.svelte';
	import CopyButtons from './CopyButtons.svelte';
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
				if (value === k) {
					let finalKey = details;
					error = '';

					// Try to decrypt with empty password
					if (details.isPrivate() && !details.isDecrypted()) {
						try {
							const decryptedKey = await decryptPrivateKey(details, '');
							if (value === k) {
								finalKey = decryptedKey;
							}
						} catch {
							// Ignore error
						}
					}
					onKeyParsed?.(finalKey);
				}
			})
			.catch((err) => {
				if (value === k) {
					error = err.message;
				}
			});
	});
</script>

{#snippet buttons()}
	<CopyButtons {value} />
{/snippet}

<CopyableTextarea
	bind:value
	{label}
	{placeholder}
	readonly={false}
	selectAllOnFocus={false}
	{error}
	{buttons}
/>
