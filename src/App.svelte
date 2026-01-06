<script>
	import { encryptMessage, decryptMessage } from './lib/pgp.js';
	import Layout from './Layout.svelte';
	import CopyableTextarea from './lib/CopyableTextarea.svelte';
	import PGPKey from './lib/PGPKey.svelte';

	let keyInput = $state('');
	let keyObject = $state(null);
	let message = $state('');
	let output = $state('');
	let isProcessing = $state(false);

	let isPrivate = $derived(keyObject?.isPrivate() ?? false);
	let mode = $derived(isPrivate ? 'Decrypt' : 'Encrypt');

	$effect(() => {
		const k = keyObject;
		const m = message;

		if (!k || !m) {
			output = '';
			return;
		}

		isProcessing = true;

		const processPromise = k.isPrivate() ? decryptMessage(k, m) : encryptMessage(k, m);

		processPromise.then((result) => {
			if (keyObject === k && message === m) {
				output = result;
				isProcessing = false;
			}
		});
	});
</script>

<Layout>
	<form class="space-y-6">
		<fieldset class="fieldset">
			<legend class="fieldset-legend">{isPrivate ? 'Private Key' : 'Public Key'}</legend>
			<PGPKey
				bind:value={keyInput}
				bind:key={keyObject}
				label={isPrivate ? 'Private Key' : 'Public Key'}
			/>
		</fieldset>

		<div class="divider"></div>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">{mode === 'Decrypt' ? 'Encrypted Message' : 'Message'}</legend
			>
			<CopyableTextarea
				bind:value={message}
				placeholder={mode === 'Decrypt'
					? 'Paste encrypted message...'
					: 'Type your secret message...'}
				label={mode === 'Decrypt' ? 'Encrypted Message' : 'Message'}
				selectAllOnFocus={false}
			/>
		</fieldset>
	</form>

	<fieldset class="fieldset">
		<legend class="fieldset-legend">
			{mode === 'Decrypt' ? 'Decrypted Message' : 'Encrypted Message'}
			{#if isProcessing}
				<span class="loading loading-spinner loading-sm ml-2"></span>
			{/if}
		</legend>
		<CopyableTextarea
			value={output}
			readonly={true}
			placeholder={mode === 'Decrypt'
				? 'Decrypted output will appear here...'
				: 'Encrypted output will appear here...'}
			label={mode === 'Decrypt' ? 'Decrypted Message' : 'Encrypted Message'}
		/>
	</fieldset>
</Layout>
