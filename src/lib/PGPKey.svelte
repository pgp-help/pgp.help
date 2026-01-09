<script lang="ts">
	import { getKeyDetails, decryptPrivateKey } from './pgp';
	import type { Key } from 'openpgp';
	import CopyableTextarea from './CopyableTextarea.svelte';
	import MiniActionButton from './MiniActionButton.svelte';
	import CopyButtons from './CopyButtons.svelte';
	import PublicKeyButtons from './PublicKeyButtons.svelte';

	let {
		value = $bindable(''),
		key = $bindable<Key | null>(null),
		label = '',
		placeholder = 'Paste PGP Key (Armored)...'
	} = $props();

	let publicKey = $derived.by(() => {
		if (!key) return null;
		if (key.toPublic) {
			return key.toPublic();
		} else {
			return key;
		}
	});

	let decryptError = $state('');
	let shaking = $state(false);

	export function nudgeForDecryption() {
		shaking = true;
		decryptError = 'Please enter passphrase to unlock.';
		setTimeout(() => {
			shaking = false;
		}, 820); // 0.82s matches the animation duration
	}

	let expirationTime = $state<Date | null>(null);

	$effect(() => {
		if (key) {
			key.getExpirationTime().then((t) => {
				expirationTime = t as Date | null;
			});
		} else {
			expirationTime = null;
		}
	});

	$effect(() => {
		// This is to do with parsing ?key=... URL params.
		// This code is in the wrong place. It should be in the PGPWorkflow for the case where key is not specified
		if (value && !key) {
			getKeyDetails(value)
				.then((k) => {
					key = k;
				})
				.catch(() => {
					// ignore
				});
		}
	});

	async function handleDecrypt(pass: string) {
		if (!key || !key.isPrivate()) return;

		decryptError = '';

		try {
			const decryptedKey = await decryptPrivateKey(key, pass);
			key = decryptedKey;
		} catch (err) {
			decryptError = (err as Error).message;
		}
	}

	function clearKey() {
		value = '';
		key = null;
		expirationTime = null;
		decryptError = '';
	}

	async function lockKey() {
		if (!value) return;
		try {
			const details = await getKeyDetails(value);
			key = details;
			decryptError = '';
		} catch (e) {
			// Should not happen if value was valid before, but good to be safe
			console.error('Failed to re-parse key', e);
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (date === (Infinity as any)) return 'Never';
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function closeOnBlur(e: FocusEvent) {
		// The element that lost focus (the collapse div)
		const target = e.currentTarget as HTMLElement;

		// Check if the new focused element (relatedTarget) is outside the collapse div.
		// If relatedTarget is null, focus left the window/document.
		// If relatedTarget is not contained within target, focus moved to another element on the page.
		if (!e.relatedTarget || !target.contains(e.relatedTarget as Node)) {
			// Find the checkbox that controls the collapse state
			const checkbox = target.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
			// Uncheck it to close the collapse
			if (checkbox) checkbox.checked = false;
		}
	}

	let properties = $derived.by(() => {
		if (!key) return [];

		const created = formatDate(key.getCreationTime());
		const expires = expirationTime ? formatDate(expirationTime) : null;
		const validity =
			expires && expires !== 'Never'
				? `${created} (expires: ${expires})`
				: `${created} (never expires)`;

		return [
			{
				label: 'ID',
				value: key.getKeyID().toHex(),
				tooltip: 'The short 8-character identifier for this key'
			},
			{
				label: 'FP',
				value: key.getFingerprint(),
				tooltip: 'The full unique fingerprint of the key'
			},
			{
				label: 'Created',
				value: validity,
				tooltip: 'Key creation and expiration dates'
			},
			{
				label: 'Type',
				value: `${key.getAlgorithmInfo().algorithm.toUpperCase()} ${key.getAlgorithmInfo().bits ? `(${key.getAlgorithmInfo().bits} bit)` : ''}`,
				tooltip: 'The cryptographic algorithm and key size'
			}
		];
	});
</script>

{#snippet warningIcon()}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="stroke-current shrink-0 h-4 w-4"
		fill="none"
		viewBox="0 0 24 24"
		><path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
		/></svg
	>
{/snippet}

{#snippet lockIcon()}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="stroke-current shrink-0 h-3 w-3"
		fill="none"
		viewBox="0 0 24 24"
		><path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
		/></svg
	>
{/snippet}

{#snippet copyButtons()}
	<CopyButtons value={key?.armor() || ''} />
{/snippet}

{#snippet publicKeyButtons()}
	<PublicKeyButtons value={publicKey?.armor ? publicKey.armor() : value} />
{/snippet}

{#if key}
	<div class="card bg-base-200 border selectable">
		<div class="card-body">
			<div>
				<!-- to force card-body to treat this as a single item -->
				<div class="flex items-center gap-2 mb-1">
					<h4 class="font-bold text-lg">{key.getUserIDs()[0] || 'Unknown User'}</h4>
					<span class="badge {key.isPrivate() ? 'badge-secondary' : 'badge-primary'} badge-sm">
						{key.isPrivate() ? 'Private Key' : 'Public Key'}
					</span>
					{#if key.isPrivate()}
						{#if key.isDecrypted()}
							<span class="badge badge-success badge-sm">Unlocked</span>
							<button
								type="button"
								class="btn btn-xs btn-ghost btn-circle"
								onclick={(e) => {
									e.preventDefault();
									lockKey();
								}}
								aria-label="Lock key"
								title="Lock key"
							>
								{@render lockIcon()}
							</button>
						{:else}
							<span class="badge badge-warning badge-sm">Locked</span>
						{/if}
					{/if}
				</div>

				{#each properties as prop (prop.label)}
					<div class="text-xs font-mono opacity-70 flex items-start gap-1">
						<div class="tooltip" data-tip={prop.tooltip}>
							<span class="cursor-help">{prop.label}</span>:
						</div>
						<span class="break-all">{prop.value}</span>
					</div>
				{/each}

				{#if key.getUserIDs().length > 1}
					<div class="mt-2 text-xs opacity-60">
						+{key.getUserIDs().length - 1} other ID(s)
					</div>
				{/if}

				{#if key.isPrivate() && !key.isDecrypted()}
					<div class="divider my-2"></div>
					<div class="form-control w-full max-w-xs {shaking ? 'shake' : ''}">
						<label class="label" for="passphrase">
							<span class="label-text">Unlock Private Key</span>
						</label>
						<div class="join">
							<input
								type="password"
								id="passphrase"
								placeholder="Passphrase"
								class="input input-bordered input-sm w-full join-item
									{decryptError ? 'input-error' : ''}"
								oninput={() => {
									decryptError = '';
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleDecrypt(e.currentTarget.value);
									}
								}}
							/>
							<button
								type="button"
								class="btn btn-sm btn-primary join-item"
								onclick={(e) => {
									const input = e.currentTarget.previousElementSibling as HTMLInputElement;
									handleDecrypt(input.value);
								}}
							>
								Unlock
							</button>
						</div>
						{#if decryptError}
							<div class="text-error text-xs mt-1">{decryptError}</div>
						{/if}
					</div>
					<div class="divider my-2"></div>
				{/if}
				<div class="mt-4 flex flex-col gap-2">
					<div
						class="collapse collapse-arrow border border-base-300 bg-base-100"
						onfocusout={closeOnBlur}
					>
						<input type="checkbox" />
						<div class="collapse-title text-xs font-medium">Show Public Key</div>
						<div class="collapse-content">
							<CopyableTextarea
								value={publicKey?.armor ? publicKey.armor() : ''}
								class="text-xs"
								fixed
								buttons={publicKeyButtons}
							/>
						</div>
					</div>

					{#if key.isPrivate()}
						<div
							class="collapse collapse-arrow border border-base-300 bg-base-100"
							onfocusout={closeOnBlur}
						>
							<input type="checkbox" />
							<div class="collapse-title text-xs font-medium flex items-center gap-2">
								Export Private Key
								<div
									class="tooltip tooltip-right text-warning"
									data-tip="Warning: Never share your private key!"
								>
									{@render warningIcon()}
								</div>
							</div>
							<div class="collapse-content">
								<div class="alert alert-warning text-xs py-2 mb-2">
									{@render warningIcon()}
									<span>Warning: Never share your private key!</span>
								</div>
								<CopyableTextarea value={key.armor()} class="text-xs" fixed buttons={copyButtons} />
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="absolute top-2 right-2 flex gap-1">
				<MiniActionButton label="Remove Key" onclick={clearKey}>✕</MiniActionButton>
			</div>
		</div>
	</div>
{:else}
	<CopyableTextarea
		bind:value
		{label}
		{placeholder}
		readonly={false}
		selectAllOnFocus={false}
		error={decryptError}
		buttons={publicKeyButtons}
	/>
{/if}

<style>
	.shake {
		animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
		transform: translate3d(0, 0, 0);
		backface-visibility: hidden;
		perspective: 1000px;
	}

	@keyframes shake {
		10%,
		90% {
			transform: translate3d(-1px, 0, 0);
		}

		20%,
		80% {
			transform: translate3d(2px, 0, 0);
		}

		30%,
		50%,
		70% {
			transform: translate3d(-4px, 0, 0);
		}

		40%,
		60% {
			transform: translate3d(4px, 0, 0);
		}
	}
</style>
