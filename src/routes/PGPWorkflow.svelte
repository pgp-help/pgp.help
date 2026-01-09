<script lang="ts">
	import { encryptMessage, decryptMessage, getKeyDetails, decryptPrivateKey } from '../lib/pgp.js';
	import CopyableTextarea from '../lib/CopyableTextarea.svelte';
	import PGPKey from '../lib/PGPKey.svelte';
	import type { Key } from 'openpgp';
	import CopyButtons from '../lib/CopyButtons.svelte';
	import { PGPMode, type PGPModeType } from '../lib/types.js';
	import KeySidebar from '../lib/KeySidebar.svelte';
	import { router } from '../lib/router.svelte.js';
	import { keyStore } from '../lib/keyStore.svelte.js';

	let { initialKey = '' } = $props<{
		initialKey?: string;
	}>();

	// Derived state from router
	let mode = $derived(router.activeRoute.pgp.mode);
	let fingerprint = $derived(router.activeRoute.pgp.fingerprint);
	let keyParam = $derived(router.activeRoute.pgp.keyParam);

	// The parsed OpenPGP key object (null if invalid/empty)
	let keyObject = $state<Key | null>(null);
	// The raw armored key string (bound to the textarea/input)
	let keyValue = $state(initialKey);
	// Reference to the PGPKey component instance (for calling methods like nudgeForDecryption)
	let pgpKeyComponent = $state();
	// The input message to be encrypted or decrypted
	let message = $state('');
	// The result of the encryption or decryption operation
	let output = $state('');
	// Any error message from the operation (e.g. decryption failure)
	let error = $state('');
	// Error message for key parsing
	let keyError = $state('');

	$effect(() => {
		if (initialKey !== undefined && initialKey !== '') {
			keyValue = initialKey;
		}
	});

	// Sync keyValue from router state (fingerprint or keyParam)
	$effect(() => {
		// This effect runs when fingerprint or keyParam changes
		if (fingerprint) {
			const stored = keyStore.getKey(fingerprint);
			if (stored) {
				keyValue = stored.armor();
			}
		} else if (keyParam) {
			keyValue = keyParam;
		} else {
			// If we navigated to root, clear key
			// Only clear if initialKey is not set (to avoid clearing on first load if passed via prop)
			if (!initialKey) {
				keyValue = '';
			}
		}
	});

	// When a valid key is parsed, save it and update URL if needed
	$effect(() => {
		if (keyObject) {
			const fp = keyObject.getFingerprint();
			console.log(`WF: Got a new key ${fp}`);

			keyStore.addKey(keyObject).then(() => {
				// If we are not already viewing this key (by fingerprint), navigate to it.
				if (fingerprint !== fp) {
					// Determine target mode
					let targetMode = mode;
					// Default to decrypt for private keys if not specified
					if (keyObject.isPrivate() && !router.activeRoute.pgp.mode) {
						targetMode = PGPMode.DECRYPT;
					}
					router.openKey(fp, targetMode);
				}
			});
		}
	});

	// Try to parse the key whenever keyValue changes
	$effect(() => {
		const k = keyValue;
		if (!k) {
			keyObject = null;
			keyError = '';
			return;
		}

		// If we already have a key object and it matches the string, don't re-parse
		// This avoids infinite loops if we update keyValue from keyObject
		if (keyObject && keyObject.armor() === k) {
			return;
		}

		getKeyDetails(k)
			.then(async (details) => {
				if (keyValue === k) {
					keyObject = details;
					keyError = '';

					// Try to decrypt with empty password
					if (details.isPrivate() && !details.isDecrypted()) {
						try {
							const decryptedKey = await decryptPrivateKey(details, '');
							if (keyValue === k) {
								keyObject = decryptedKey;
							}
						} catch {
							// Ignore error, key is likely password protected
						}
					}
				}
			})
			.catch((err) => {
				if (keyValue === k) {
					keyObject = null;
					keyError = err.message;
				}
			});
	});

	// Update keyValue when keyObject changes (e.g. after decryption)
	$effect(() => {
		if (keyObject && keyObject.armor() !== keyValue) {
			keyValue = keyObject.armor();
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
			router.setMode(newMode);
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
				{#if keyObject}
					<PGPKey bind:this={pgpKeyComponent} key={keyObject} />
				{:else}
					<CopyableTextarea
						bind:value={keyValue}
						label={isPrivate ? 'Private Key' : 'Public Key'}
						placeholder="Paste PGP Key (Armored)..."
						readonly={false}
						selectAllOnFocus={false}
						error={keyError}
						buttons={copyButtonsSnippet}
					/>
				{/if}
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
									onclick={() => router.setMode(availableMode)}
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
