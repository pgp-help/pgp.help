<script lang="ts">
	import { encryptMessage, decryptMessage } from '../lib/pgp.js';
	import CopyableTextarea from '../lib/CopyableTextarea.svelte';
	import PGPKey from '../lib/PGPKey.svelte';
	import type { Key } from 'openpgp';
	import CopyButtons from '../lib/CopyButtons.svelte';

	let { initialKey = '', onKeyChange } = $props<{
		// The initial armored key string to display (e.g. from URL/Store)
		initialKey?: string;
		// Callback to notify parent when a VALID key is parsed.
		onKeyChange?: (keyObject: Key) => void;
	}>();

	// The parsed OpenPGP key object (null if invalid/empty)
	let keyObject = $state<Key | null>(null);
	// The raw armored key string (bound to the textarea/input)
	let keyValue = $state(initialKey);
	// Reference to the PGPKey component instance (for calling methods like nudgeForDecryption)
	let pgpKeyComponent;
	// The input message to be encrypted or decrypted
	let message = $state('');
	// The result of the encryption or decryption operation
	let output = $state('');
	// Any error message from the operation (e.g. decryption failure)
	let error = $state('');

	$effect(() => {
		if (initialKey !== undefined) {
			keyValue = initialKey;
		}
	});

	$effect(() => {
		if (keyObject) {
			onKeyChange?.(keyObject);
		}
	});

	let isPrivate = $derived(keyObject?.isPrivate() ?? false);
	let mode = $derived(isPrivate ? 'Decrypt' : 'Encrypt');

	// Expose key state for parent to observe
	export function getCurrentKey() {
		return { keyObject, keyValue };
	}

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

{#snippet copyButtonsSnippet()}
	<CopyButtons value={message} />
{/snippet}

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
			buttons={copyButtonsSnippet}
		/>
	</fieldset>
</form>

{#snippet outputButtonsSnippet()}
	<CopyButtons value={output} />
{/snippet}

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
		buttons={outputButtonsSnippet}
	/>
</fieldset>
