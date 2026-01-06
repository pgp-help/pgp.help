<script lang="ts">
	import { encryptMessage, decryptMessage } from '../lib/pgp.js';
	import CopyableTextarea from '../lib/CopyableTextarea.svelte';
	import PGPKey from '../lib/PGPKey.svelte';
	import type { Key } from 'openpgp';

	let keyObject = $state<Key | null>(null);
	let keyValue = $state('');
	let pgpKeyComponent;
	let message = $state('');
	let output = $state('');
	let error = $state('');

	$effect(() => {
		// On initial load, check for 'key' parameter in URL and use that as the keyValue
		const params = new URLSearchParams(window.location.search);
		const keyParam = params.get('key');
		if (keyParam && !keyValue) {
			keyValue = keyParam;
			const newUrl = window.location.pathname;
			window.history.replaceState({}, '', newUrl);
		}
	});

	let isPrivate = $derived(keyObject?.isPrivate() ?? false);
	let mode = $derived(isPrivate ? 'Decrypt' : 'Encrypt');

	let prevKeyObject = null;
	let prevMessage = '';

	$effect(() => {
		const k = keyObject;
		const m = message;

		const keyChanged = k?.getFingerprint() !== prevKeyObject?.getFingerprint();
		const messageChanged = m !== prevMessage;

		prevKeyObject = k;
		prevMessage = m;

		if (!k || !m) {
			output = '';
			error = '';
			return;
		}

		if (k.isPrivate() && !k.isDecrypted()) {
			if (!keyChanged && !messageChanged) {
				//This is probably the user just locking the key again, so don't reset / nudge.
				return;
			}
			pgpKeyComponent?.nudgeForDecryption();
			output = '';
			error = '';

			//Fall through so that we also see any other errors (e.g. invalid armor)
		}

		error = '';

		const processPromise = k.isPrivate() ? decryptMessage(k, m) : encryptMessage(k, m);

		processPromise
			.then((result) => {
				if (keyObject === k && message === m) {
					output = result;
				}
			})
			.catch((err) => {
				if (keyObject === k && message === m) {
					error = err.message;
				}
			});
	});
</script>

<form class="space-y-6">
	<fieldset class="fieldset">
		<legend class="fieldset-legend">
			{#if isPrivate}
				Private Key
			{:else}
				Public Key
			{/if}
		</legend>
		<PGPKey
			bind:this={pgpKeyComponent}
			bind:key={keyObject}
			bind:value={keyValue}
			label={isPrivate ? 'Private Key' : 'Public Key'}
		/>
	</fieldset>

	<div class="divider"></div>

	<fieldset class="fieldset">
		<legend class="fieldset-legend">{mode === 'Decrypt' ? 'Encrypted Message' : 'Message'}</legend>
		<CopyableTextarea
			bind:value={message}
			placeholder={mode === 'Decrypt'
				? 'Paste encrypted message...'
				: 'Type your secret message...'}
			label={mode === 'Decrypt' ? 'Encrypted Message' : 'Message'}
			selectAllOnFocus={false}
			{error}
		/>
	</fieldset>
</form>

<fieldset class="fieldset">
	<legend class="fieldset-legend">
		{mode === 'Decrypt' ? 'Decrypted Message' : 'Encrypted Message'}
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
