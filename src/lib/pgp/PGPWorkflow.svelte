<script lang="ts">
	import { encryptMessage, decryptMessage, signMessage, verifySignature } from './crypto';
	import { isAGEEncryptedMessage } from './crypto';
	import KeyDetails from './KeyDetails.svelte';
	import RawKeyInput from './RawKeyInput.svelte';
	import { type KeyWrapper } from './keyStore.svelte.js';
	import { type CryptoKey, KeyType } from './crypto';
	import { untrack } from 'svelte';
	import CardWithHeader from '../ui/CardWithHeader.svelte';
	import ShareMenu from '../ui/ShareMenu.svelte';

	const OperationType = {
		Encrypt: 'encrypt',
		Decrypt: 'decrypt',
		Sign: 'sign',
		Verify: 'verify'
	} as const;

	type OperationType = (typeof OperationType)[keyof typeof OperationType];

	interface Props {
		keyWrapper: KeyWrapper | null;
		onKeyParsed: (key: CryptoKey) => void;
		keyValue?: string;
	}
	let { keyWrapper = $bindable(), onKeyParsed, keyValue = $bindable('') }: Props = $props();

	let keyObject = $derived(keyWrapper?.key ?? null);

	$effect(() => {
		if (keyWrapper) {
			keyValue = '';
		}
	});

	// Reference to the KeyDetails component instance (for calling methods like nudgeForDecryption)
	let pgpKeyComponent = $state<KeyDetails | null>(null);
	// The input message to be encrypted or decrypted
	let message = $state('');
	// The result of the encryption or decryption operation
	let output = $state('');
	// Any error message from the operation (e.g. decryption failure)
	let error = $state('');
	let verificationStatus = $state<'valid' | 'invalid' | null>(null);
	let signerIdentity = $state<string | null>(null);

	let isPrivate = $derived(keyObject?.isPrivate() ?? false);
	let isAGE = $derived(keyObject?.type === KeyType.AGE);
	let isEncryptedMessage = $derived(
		message.trim().startsWith('-----BEGIN PGP MESSAGE-----') || isAGEEncryptedMessage(message)
	);
	let isSignedMessage = $derived(message.trim().startsWith('-----BEGIN PGP SIGNED MESSAGE-----'));

	let currentOperation = $derived.by(() => {
		if (isPrivate) {
			// Private Key: Decrypt or Sign
			if (isAGE) {
				// AGE is mainly for encryption/decryption, signatures not supported
				return OperationType.Decrypt;
			}
			return isEncryptedMessage ? OperationType.Decrypt : OperationType.Sign;
		} else {
			// Public Key: Encrypt or Verify
			if (isAGE) {
				return OperationType.Encrypt;
			}
			return isSignedMessage ? OperationType.Verify : OperationType.Encrypt;
		}
	});

	$effect(() => {
		// Wrap async logic in a non-async function to comply with $effect requirements.
		// $effect callbacks must return void or a cleanup function, not a Promise.
		const currentMessage = message;

		// If we are in ENCRYPT mode (Public Key) and we have a private key available
		if (!isPrivate && keyWrapper?.masterKey) {
			if (
				currentMessage.trim().startsWith('-----BEGIN PGP MESSAGE-----') ||
				(isAGE && isAGEEncryptedMessage(currentMessage))
			) {
				keyWrapper = keyWrapper.masterKey;
				output = '';
			}
		}
	});

	$effect(() => {
		void verificationStatus; // To trigger the event
		const k = untrack(() => keyObject);

		if (verificationStatus) {
			signerIdentity = k.getUserIDs()[0] || '<unknown>';
		}
	});

	$effect(() => {
		const k = keyObject;
		const m = message;
		const currentIsPrivate = isPrivate;
		const op = currentOperation;

		verificationStatus = null;

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

		let processPromise: Promise<string | boolean>;

		if (op === OperationType.Decrypt) {
			processPromise = decryptMessage(k, m);
		} else if (op === OperationType.Sign) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			processPromise = signMessage(k as any, m);
		} else if (op === OperationType.Verify) {
			processPromise = verifySignature(k, m);
		} else {
			processPromise = encryptMessage(k, m);
		}

		processPromise
			.then((result) => {
				if (isPrivate === currentIsPrivate && keyObject === k && message === m) {
					if (op === OperationType.Verify) {
						console.log('verified ok');
						verificationStatus = 'valid';
						output = '';
					} else {
						output = result as string;
					}
				}
			})
			.catch((err) => {
				if (isPrivate === currentIsPrivate && keyObject === k && message === m) {
					if (op === OperationType.Verify) {
						console.log('verified failed: ', err);
						verificationStatus = 'invalid';
						error = err.message;
					} else {
						error = err.message;
					}
				}
			});
	});
</script>

<div class="container mx-auto max-w-4xl space-y-6">
	<div class="space-y-6">
		<!-- Key Section -->
		{#if keyWrapper}
			<KeyDetails bind:this={pgpKeyComponent} bind:keyWrapper />
		{:else}
			<RawKeyInput {keyValue} {onKeyParsed} />
		{/if}

		<!-- IO Fields -->
		<div data-testid="io_fields">
			{#if !isPrivate}
				{#if currentOperation === OperationType.Verify}
					{#if verificationStatus === 'valid'}
						<div role="alert" class="alert alert-success mt-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
							<div class="flex flex-col">
								<span class="font-bold">Signature Verified!</span>
								{#if signerIdentity}
									<span class="text-sm opacity-80">Signed by: {signerIdentity}</span>
								{/if}
							</div>
						</div>
					{:else if verificationStatus === 'invalid'}
						<div role="alert" class="alert alert-error mt-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
							<span>Verification Failed: {error}</span>
						</div>
					{/if}
				{/if}
			{/if}

			<!-- Input Message -->
			<div class="mt-4">
				<CardWithHeader title="Input Message" class="w-full shadow-sm" {error}>
					{#snippet actions()}
						<ShareMenu value={message} />
					{/snippet}

					{#snippet children(uid)}
						<textarea
							id={uid}
							bind:value={message}
							aria-label="Input Message"
							class="textarea textarea-ghost h-32 w-full resize-y border-none focus:outline-none focus:bg-transparent"
							placeholder={isPrivate
								? 'Type message to sign...\n or Paste encrypted message to decrypt...'
								: 'Type your secret message...\n or Paste signed message to verify...'}
						></textarea>
					{/snippet}
				</CardWithHeader>
			</div>

			<!-- Output Section -->
			{#if !isPrivate}
				{#if currentOperation !== OperationType.Verify}
					<div class="mt-4">
						<CardWithHeader title="Encrypted Output" readonly={true} class="w-full shadow-sm">
							{#snippet actions()}
								<ShareMenu value={output} />
							{/snippet}

							{#snippet children(uid)}
								<div
									id={uid}
									aria-label="Encrypted Output"
									class="p-4 font-mono text-xs whitespace-pre-wrap opacity-75"
									role="textbox"
									aria-readonly="true"
								>
									{#if output}
										{output}
									{:else}
										Encrypted output will appear here...
									{/if}
								</div>
							{/snippet}
						</CardWithHeader>
					</div>
				{/if}
			{:else}
				<div class="mt-4">
					<CardWithHeader
						title={currentOperation === OperationType.Decrypt
							? 'Decrypted Output'
							: 'Signed Message'}
						readonly={true}
						class="w-full shadow-sm"
					>
						{#snippet actions()}
							<ShareMenu value={output} />
						{/snippet}

						{#snippet children(uid)}
							<div
								id={uid}
								aria-label={currentOperation === OperationType.Decrypt
									? 'Decrypted Output'
									: 'Signed Message'}
								class="p-4 font-mono text-xs whitespace-pre-wrap opacity-75"
								role="textbox"
								aria-readonly="true"
							>
								{#if output}
									{output}
								{:else}
									Signed / Decrypted message will appear here...
								{/if}
							</div>
						{/snippet}
					</CardWithHeader>
				</div>
			{/if}
		</div>
	</div>
</div>
