<script lang="ts">
	import { getKeyDetails, decryptPrivateKey } from './pgp';
	import type { Key } from 'openpgp';
	import CopyableTextarea from '../ui/CopyableTextarea.svelte';
	import CopyButtons from '../ui/CopyButtons.svelte';
	import PublicKeyButtons from './PublicKeyButtons.svelte';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';
	import LockIcon from '../ui/icons/LockIcon.svelte';

	// Bindable because when we decrypt the key we modify it in place and expect the
	// parent component to see the updated value.
	let { key = $bindable<Key>() } = $props<{
		key: Key;
	}>();

	let publicKey = $derived.by(() => {
		if (key.isPrivate()) {
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
		key.getExpirationTime().then((t) => {
			expirationTime = t as Date | null;
		});
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

	async function lockKey() {
		try {
			const details = await getKeyDetails(key.armor());
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
				tooltip: 'The full unique fingerprint of the key',
				hidden: true
			},
			{
				label: 'Created',
				value: validity,
				tooltip: 'Key creation and expiration dates',
				hidden: true
			},
			{
				label: 'Type',
				value: `${key.getAlgorithmInfo().algorithm.toUpperCase()} ${key.getAlgorithmInfo().bits ? `(${key.getAlgorithmInfo().bits} bit)` : ''}`,
				tooltip: 'The cryptographic algorithm and key size',
				hidden: true
			}
		];
	});

	let showDetails = $state(false);
</script>

{#snippet copyButtons()}
	<CopyButtons value={key.armor()} />
{/snippet}

{#snippet publicKeyButtons()}
	<PublicKeyButtons value={publicKey?.armor ? publicKey.armor() : key.armor()} />
{/snippet}

<div class="card bg-base-200 border selectable w-full max-w-full overflow-hidden">
	<div class="card-body p-3 sm:p-4">
		<div>
			<!-- to force card-body to treat this as a single item -->
			<div class="flex flex-wrap items-center gap-2 mb-1">
				<h4 class="font-bold text-lg break-all">{key.getUserIDs()[0] || 'Unknown User'}</h4>
				<div class="flex gap-1 shrink-0">
					<span class="badge {key.isPrivate() ? 'badge-secondary' : 'badge-primary'} badge-sm">
						{key.isPrivate() ? 'Private' : 'Public'}
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
								<LockIcon class="h-3 w-3" />
							</button>
						{:else}
							<span class="badge badge-warning badge-sm">Locked</span>
						{/if}
					{/if}
				</div>
			</div>

			{#each properties as prop (prop.label)}
				{#if !prop.hidden || showDetails}
					<div class="text-xs font-mono opacity-70 flex items-start gap-1">
						<div class="tooltip" data-tip={prop.tooltip}>
							<span class="cursor-help">{prop.label}</span>:
						</div>
						<span class="break-all">{prop.value}</span>
					</div>
				{/if}
			{/each}

			{#if !showDetails}
				<button
					class="btn btn-xs btn-link p-0 h-auto min-h-0 text-xs opacity-60 hover:opacity-100 no-underline"
					onclick={() => (showDetails = true)}
				>
					Show more details...
				</button>
			{:else}
				<button
					class="btn btn-xs btn-link p-0 h-auto min-h-0 text-xs opacity-60 hover:opacity-100 no-underline"
					onclick={() => (showDetails = false)}
				>
					Show less details
				</button>
			{/if}

			{#if key.getUserIDs().length > 1 && showDetails}
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
							nowrap={true}
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
								<WarningIcon class="h-4 w-4" />
							</div>
						</div>
						<div class="collapse-content">
							<div class="alert alert-warning text-xs py-2 mb-2">
								<WarningIcon class="h-4 w-4" />
								<span>Warning: Never share your private key!</span>
							</div>
							<CopyableTextarea
								value={key.armor()}
								class="text-xs"
								fixed
								nowrap={true}
								buttons={copyButtons}
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

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
