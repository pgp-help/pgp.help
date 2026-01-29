<script lang="ts">
	import { decryptPrivateKey } from './pgp';
	import { type KeyWrapper, asPublicKeyWrapper } from './keyStore.svelte.js';
	import WarningIcon from '../ui/icons/WarningIcon.svelte';
	import PGPKeyBadges from './PGPKeyBadges.svelte';
	import KeyActions from './KeyActions.svelte';
	import Avatar from '../ui/Avatar.svelte';
	import CardWithHeader from '../ui/CardWithHeader.svelte';
	import { type CryptoKey, wrapPGPKey, isPGPKey } from './crypto';
	import SelectableText from '../ui/SelectableText.svelte';

	// Bindable because when we decrypt the key we modify it in place and expect the
	// parent component to see the updated value.
	let { keyWrapper = $bindable() } = $props<{
		keyWrapper: KeyWrapper;
	}>();

	let key = $derived<CryptoKey>(keyWrapper.key);

	let publicKey = $derived.by(() => {
		if (key.isPrivate()) {
			return key.toPublic();
		} else {
			return key;
		}
	});

	let decryptError = $state('');
	let shaking = $state(false);

	const KEY_PROPERTY_CLASS = 'text-xs font-mono opacity-70 flex items-start gap-1';

	export function nudgeForDecryption() {
		shaking = true;
		decryptError = 'Please enter passphrase to unlock.';
		setTimeout(() => {
			shaking = false;
		}, 820); // 0.82s matches the animation duration
	}

	function switchToPublic() {
		keyWrapper = asPublicKeyWrapper(keyWrapper);
	}

	function switchToPrivate() {
		if (keyWrapper.masterKey) {
			keyWrapper = keyWrapper.masterKey;
		}
	}

	let expirationTime = $state<Date | null>(null);

	$effect(() => {
		if (isPGPKey(key)) {
			// Access detailed properties through the underlying OpenPGP key

			const openPGPKey = key.getOpenPGPKey();
			openPGPKey.getExpirationTime().then((t) => {
				expirationTime = t as Date | null;
			});
		} else {
			// AGE keys don't expire
			expirationTime = null;
		}
	});

	async function handleDecrypt(pass: string) {
		if (!key.isPrivate()) return;

		decryptError = '';

		try {
			// Extract the underlying OpenPGP key from the facade
			if (!isPGPKey(key)) {
				throw new Error('Only PGP keys can be decrypted');
			}
			const openPGPKey = key.getOpenPGPKey();
			const decryptedKey = await decryptPrivateKey(openPGPKey, pass);
			// Wrap the decrypted OpenPGP key in a facade
			keyWrapper.key = wrapPGPKey(decryptedKey);
		} catch (err) {
			decryptError = (err as Error).message;
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (date === (Infinity as any)) return 'Never';
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	let properties = $derived.by(
		(): Array<{ label: string; value: string; tooltip: string; hidden?: boolean }> => {
			if (isPGPKey(key)) {
				// Access creation time through underlying OpenPGP key
				const openPGPKey = key.getOpenPGPKey();
				const created = formatDate(openPGPKey.getCreationTime() as Date);
				const expires = expirationTime ? formatDate(expirationTime) : null;
				const validity =
					expires && expires !== 'Never'
						? `${created} (expires: ${expires})`
						: `${created} (never expires)`;
				const props = [
					{
						label: 'ID',
						value: key.getId(), // Use consistent getId method
						tooltip: 'The short identifier for this key'
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
						value: (() => {
							// Access algorithm info through underlying OpenPGP key
							const algorithmInfo = openPGPKey.getAlgorithmInfo();
							return `${algorithmInfo.algorithm.toUpperCase()} ${algorithmInfo.bits ? `(${algorithmInfo.bits} bit)` : ''}`;
						})(),
						tooltip: 'The cryptographic algorithm and key size',
						hidden: true
					}
				];
				return props;
			} else {
				// AGE key
				const props = [
					{
						label: 'Public Key',
						value: key.getFingerprint(), // Use generic getID
						tooltip: 'The short identifier for this key'
					}
				];
				return props;
			}
		}
	);

	let showDetails = $state(false);
	let publicKeyOpen = $state(false);
	let privateKeyOpen = $state(false);

	function handleFocusOut(event: FocusEvent) {
		const currentTarget = event.currentTarget as HTMLElement;
		const relatedTarget = event.relatedTarget as Node | null;

		if (!currentTarget.contains(relatedTarget)) {
			publicKeyOpen = false;
			privateKeyOpen = false;
		}
	}

	let cardTitle = $derived(key.isPrivate() ? 'Private Key' : 'Public Key');
</script>

{#snippet privateKeySnippet()}
	<details class="mt-2" bind:open={privateKeyOpen}>
		<summary class={KEY_PROPERTY_CLASS}>
			Private Key:
			<span class="opacity-60 cursor-pointer">[click to export]</span>
		</summary>
		<div class="mt-2 ml-0">
			<div class="alert alert-warning text-xs py-2 mb-2">
				<WarningIcon class="h-4 w-4" />
				<span>Warning: For backup only. Never share your private key!</span>
			</div>
			<SelectableText
				class="rounded-box bg-base-200 border border-base-300 w-fit"
				value={key.getArmor()}
			/>
		</div>
	</details>
{/snippet}

<CardWithHeader title={cardTitle} class="w-full shadow-sm" onfocusout={handleFocusOut}>
	{#snippet actions()}
		<KeyActions {keyWrapper} />
	{/snippet}

	<div class="p-3 sm:p-4">
		<div class="flex flex-wrap items-center gap-3 mb-1">
			<Avatar cryptoKey={key} size={64} />
			<div class="flex-1 min-w-0">
				<h4 class="font-bold text-lg break-all">{key.getUserIDs()[0] || 'Unknown User'}</h4>
				<div class="flex items-center gap-2 mt-1">
					<div class="flex gap-1 shrink-0">
						<PGPKeyBadges {keyWrapper} />
					</div>
				</div>
			</div>
		</div>

		<!-- PGP Keys: Show properties with showDetails toggle -->
		{#each properties as prop (prop.label)}
			{#if !prop.hidden || showDetails}
				<div class={KEY_PROPERTY_CLASS}>
					<div class="tooltip tooltip-right" data-tip={prop.tooltip}>
						<span class="cursor-help">{prop.label}</span>:
					</div>
					<span class="break-all">{prop.value}</span>
				</div>
			{/if}
		{/each}
		{#if isPGPKey(key)}
			{#if key.getUserIDs().length > 1 && showDetails}
				<div class="mt-2 text-xs opacity-60">
					+{key.getUserIDs().length - 1} other ID(s)
				</div>
			{/if}

			{#if showDetails}
				<div class="mt-2">
					<details class="mt-1" bind:open={publicKeyOpen}>
						<summary class={KEY_PROPERTY_CLASS}>
							Public Key:
							<span class="opacity-60 cursor-pointer">[click to show]</span>
						</summary>
						<div class="mt-2 ml-0">
							<SelectableText
								class="rounded-box bg-base-200 border border-base-300 w-fit"
								value={publicKey.getArmor()}
							/>
						</div>
					</details>

					{#if key.isPrivate()}
						{@render privateKeySnippet()}
					{/if}
				</div>
			{/if}

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
		{:else if key.isPrivate()}
			{@render privateKeySnippet()}
		{/if}

		{#if key.isPrivate()}
			<div class="mt-2">
				<button class="btn btn-xs btn-outline" onclick={switchToPublic}>
					Switch to Public Key
				</button>
			</div>
		{:else if keyWrapper.masterKey}
			<div class="mt-2">
				<button class="btn btn-xs btn-outline" onclick={switchToPrivate}>
					Switch to Private Key
				</button>
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
		{/if}
	</div>
</CardWithHeader>

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
