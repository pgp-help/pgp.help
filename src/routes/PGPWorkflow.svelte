<script lang="ts">
	import { encryptMessage, decryptMessage } from '../lib/pgp.js';
	import CopyableTextarea from '../lib/CopyableTextarea.svelte';
	import PGPKey from '../lib/PGPKey.svelte';
	import type { Key } from 'openpgp';
	import CopyButtons from '../lib/CopyButtons.svelte';
	import { PGPMode, type PGPModeType } from '../lib/types.js';
	import KeySidebar from '../lib/KeySidebar.svelte';

	let {
		initialKey = '',
		onKeyChange,
		mode = PGPMode.ENCRYPT,
		onModeChange
	} = $props<{
		// The initial armored key string to display (e.g. from URL/Store)
		initialKey?: string;
		// Callback to notify parent when a VALID key is parsed.
		onKeyChange?: (keyObject: Key) => void;
		// The current mode (encrypt/decrypt)
		mode?: PGPModeType;
		// Callback to notify parent when mode changes
		onModeChange?: (mode: PGPModeType) => void;
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

	// Helper to determine if mode switching should be available
	let canSwitchMode = $derived(keyObject !== null);

	// Helper to determine valid modes for current key
	let availableModes = $derived.by(() => {
		if (!keyObject) return [PGPMode.ENCRYPT];
		if (keyObject.isPrivate()) {
			return [PGPMode.ENCRYPT, PGPMode.DECRYPT];
		} else {
			return [PGPMode.ENCRYPT];
		}
	});

	// Ensure mode is valid for current key
	$effect(() => {
		if (keyObject && !availableModes.includes(mode)) {
			// If current mode is not available, switch to first available mode
			const newMode = availableModes[0] as PGPModeType;
			onModeChange?.(newMode);
		}
	});

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

		// Check if we need to decrypt the private key for the current operation
		if (mode === PGPMode.DECRYPT && k.isPrivate() && !k.isDecrypted()) {
			if (!keyChanged && !messageChanged) {
				//This is probably the user just locking the key again, so don't reset / nudge.
				return;
			}
			pgpKeyComponent?.nudgeForDecryption();
			output = '';
			error = '';
			return; // Don't proceed until key is unlocked
		}

		error = '';

		const processPromise = mode === PGPMode.DECRYPT ? decryptMessage(k, m) : encryptMessage(k, m);

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

<aside aria-label="Sidebar">
	<KeySidebar />
</aside>

<main class="flex-1 overflow-y-auto p-4 sm:p-8" aria-label="PGP Workflow">
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
				<PGPKey
					bind:this={pgpKeyComponent}
					bind:key={keyObject}
					bind:value={keyValue}
					label={isPrivate ? 'Private Key' : 'Public Key'}
				/>
			</fieldset>

			{#if canSwitchMode && availableModes.length > 1}
				<div class="divider"></div>
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Mode</legend>
					<div class="form-control">
						<div class="join">
							{#each availableModes as availableMode (availableMode)}
								<button
									type="button"
									class="btn join-item {mode === availableMode ? 'btn-primary' : 'btn-outline'}"
									onclick={() => onModeChange?.(availableMode)}
								>
									{availableMode === PGPMode.ENCRYPT ? 'Encrypt' : 'Decrypt'}
								</button>
							{/each}
						</div>
					</div>
				</fieldset>
			{/if}

			<div class="divider"></div>

			<fieldset class="fieldset">
				<legend class="fieldset-legend"
					>{mode === PGPMode.DECRYPT ? 'Encrypted Message' : 'Message'}</legend
				>
				<CopyableTextarea
					bind:value={message}
					placeholder={mode === PGPMode.DECRYPT
						? 'Paste encrypted message...'
						: 'Type your secret message...'}
					label={mode === PGPMode.DECRYPT ? 'Encrypted Message' : 'Message'}
					selectAllOnFocus={false}
					{error}
					buttons={copyButtonsSnippet}
				/>
			</fieldset>

			{#snippet outputButtonsSnippet()}
				<CopyButtons value={output} />
			{/snippet}

			<fieldset class="fieldset">
				<legend class="fieldset-legend">
					{mode === PGPMode.DECRYPT ? 'Decrypted Message' : 'Encrypted Message'}
				</legend>
				<CopyableTextarea
					value={output}
					readonly={true}
					placeholder={mode === PGPMode.DECRYPT
						? 'Decrypted output will appear here...'
						: 'Encrypted output will appear here...'}
					label={mode === PGPMode.DECRYPT ? 'Decrypted Message' : 'Encrypted Message'}
					buttons={outputButtonsSnippet}
				/>
			</fieldset>
		</form>
	</div>
</main>
