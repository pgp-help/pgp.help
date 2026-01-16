<script lang="ts">
	import { encryptMessage, decryptMessage } from './pgp.js';
	import CopyableTextarea from '../ui/CopyableTextarea.svelte';
	import PGPKey from './PGPKey.svelte';
	import RawKeyInput from './RawKeyInput.svelte';
	import { type KeyWrapper } from './keyStore.svelte.js';
	import type { Key } from 'openpgp';

	interface Props {
		keyWrapper: KeyWrapper | null;
		onKeyParsed: (key: Key) => void;
		keyValue?: string;
	}
	let { keyWrapper = $bindable(), onKeyParsed, keyValue = $bindable('') }: Props = $props();

	let keyObject = $derived(keyWrapper?.key ?? null);

	$effect(() => {
		if (keyWrapper) {
			keyValue = '';
		}
	});

	// Reference to the PGPKey component instance (for calling methods like nudgeForDecryption)
	let pgpKeyComponent = $state<PGPKey | null>(null);
	// The input message to be encrypted or decrypted
	let message = $state('');
	// The result of the encryption or decryption operation
	let output = $state('');
	// Any error message from the operation (e.g. decryption failure)
	let error = $state('');

	let isPrivate = $derived(keyObject?.isPrivate() ?? false);

	$effect(() => {
		// Wrap async logic in a non-async function to comply with $effect requirements.
		// $effect callbacks must return void or a cleanup function, not a Promise.
		const currentMessage = message;

		// If we are in ENCRYPT mode (Public Key) and we have a private key available
		if (!isPrivate && keyWrapper?.masterKey) {
			if (currentMessage.trim().startsWith('-----BEGIN PGP MESSAGE-----')) {
				keyWrapper = keyWrapper.masterKey;
				output = '';
			}
		}
	});

	$effect(() => {
		const k = keyObject;
		const m = message;
		const currentIsPrivate = isPrivate;

		if (!k || !m) {
			output = '';
			error = '';
			return;
		}

		// Check if we need to decrypt the private key for the current operation
		if (currentIsPrivate && k.isPrivate() && !k.isDecrypted()) {
			pgpKeyComponent?.nudgeForDecryption();
			output = '';
			error = 'Unlock the private key to proceed.';
			return; // Don't proceed until key is unlocked
		}

		error = '';

		// Use untrack to prevent this effect from re-running when output or error changes
		// This is important because we are setting output/error inside the promise callback
		// and we don't want to trigger the effect again.
		// Although output/error are not dependencies here, it's good practice.

		const processPromise = currentIsPrivate ? decryptMessage(k, m) : encryptMessage(k, m);

		processPromise
			.then((result) => {
				// Check if the key and message are still the same
				// We need to access the current values of keyObject and message, but we can't use them directly
				// because they are reactive. We should use the captured k and m.
				// However, we also need to check if the component state has moved on.
				// The best way is to check if k and m match the current state.
				// But since we are in a promise, we need to be careful.

				// Actually, checking against the captured k and m is correct for ensuring we don't overwrite
				// with a stale result. But we also want to make sure we don't overwrite if the user has
				// cleared the input.

				if (isPrivate === currentIsPrivate && keyObject === k && message === m) {
					output = result;
				}
			})
			.catch((err) => {
				if (isPrivate === currentIsPrivate && keyObject === k && message === m) {
					error = err.message;
				}
			});
	});
</script>

<div class="container mx-auto max-w-4xl">
	<form class="space-y-6">
		<fieldset class="fieldset">
			<legend class="fieldset-legend">
				{#if isPrivate}
					Private Key
				{:else}
					Public Key
				{/if}
			</legend>
			{#if keyWrapper}
				<PGPKey bind:this={pgpKeyComponent} bind:keyWrapper />
			{:else}
				<RawKeyInput
					bind:value={keyValue}
					label={isPrivate ? 'Private Key' : 'Public Key'}
					placeholder="Paste PGP Key (Armored)..."
					{onKeyParsed}
				/>
			{/if}
		</fieldset>

		{#if !isPrivate}
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Message</legend>
				<CopyableTextarea
					bind:value={message}
					placeholder="Type your secret message..."
					label="Message"
					selectAllOnFocus={false}
					{error}
					buttons={true}
				/>
			</fieldset>
			<fieldset class="fieldset mt-4">
				<legend class="fieldset-legend">Encrypted Output</legend>
				<CopyableTextarea
					value={output}
					readonly={true}
					fixed={true}
					placeholder="Encrypted output will appear here..."
					label="Encrypted Output"
					buttons={true}
				/>
			</fieldset>
		{:else}
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Encrypted Message</legend>
				<CopyableTextarea
					bind:value={message}
					placeholder="Paste encrypted message..."
					label="Encrypted Message"
					selectAllOnFocus={false}
					{error}
					buttons={true}
				/>
			</fieldset>
			<fieldset class="fieldset mt-4">
				<legend class="fieldset-legend">Decrypted Output</legend>
				<CopyableTextarea
					value={output}
					readonly={true}
					fixed={true}
					placeholder="Decrypted output will appear here..."
					label="Decrypted Output"
					buttons={true}
				/>
			</fieldset>
		{/if}
	</form>
</div>
