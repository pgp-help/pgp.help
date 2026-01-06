<script lang="ts">
	import { getKeyDetails, decryptPrivateKey } from './pgp';
	import type { Key } from 'openpgp';
	import CopyableTextarea from './CopyableTextarea.svelte';

	let {
		value = $bindable(''),
		cleanedKey = $bindable(''),
		key = $bindable<Key | null>(null),
		label = '',
		placeholder = 'Paste PGP Key (Armored)...'
	} = $props();

	let expirationTime = $state<Date | null>(null);
	let passphrase = $state('');
	let isDecrypted = $state(false);
	let isDecrypting = $state(false);
	let decryptError = $state('');

	$effect(() => {
		const k = value;
		if (!k) {
			key = null;
			cleanedKey = '';
			expirationTime = null;
			isDecrypted = false;
			passphrase = '';
			decryptError = '';
			return;
		}

		getKeyDetails(k).then(async (details) => {
			if (value === k) {
				if (details) {
					key = details;
					cleanedKey = details.armor();
					//For whatever reason, expirationTime is a promise. So fetch that too.
					expirationTime = (await details.getExpirationTime()) as Date | null;

					// Reset decryption state for new key
					isDecrypted = false;
					passphrase = '';
					decryptError = '';

					// If private key is not encrypted, mark as decrypted immediately
					// Note: isDecrypted() method on key checks if the key material is available (decrypted)
					// However, openpgpjs Key object doesn't have isDecrypted(), we check if we can use it.
					// Actually, we can try to decrypt with empty password or check algorithm.
					// But simpler: if it's private, we assume it might need decryption unless we know otherwise.
					// Let's check if it's private.
					if (details.isPrivate()) {
						// Try to decrypt with empty password if it's not encrypted
						// or check if it is already decrypted (some keys might be unencrypted)
						// For now, we'll just wait for user interaction if it's private.
					}
				} else {
					key = null;
					cleanedKey = '';
					expirationTime = null;
					isDecrypted = false;
				}
			}
		});
	});

	async function handleDecrypt() {
		if (!key || !key.isPrivate()) return;

		isDecrypting = true;
		decryptError = '';

		const decryptedKey = await decryptPrivateKey(key, passphrase);

		isDecrypting = false;
		if (decryptedKey) {
			isDecrypted = true;
			key = decryptedKey;
		} else {
			decryptError = 'Incorrect passphrase or decryption failed';
		}
	}

	function clearKey() {
		value = '';
		cleanedKey = '';
		key = null;
		expirationTime = null;
		isDecrypted = false;
		passphrase = '';
		decryptError = '';
	}

	function switchToPublicKey() {
		if (key && key.isPrivate()) {
			value = key.toPublic().armor();
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (date === (Infinity as any)) return 'Never';
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

				{#if key.isPrivate()}
					<div class="divider my-2"></div>

					{#if !isDecrypted}
						<div class="form-control w-full max-w-xs">
							<label class="label" for="passphrase">
								<span class="label-text">Unlock Private Key</span>
							</label>
							<div class="join">
								<input
									type="password"
									id="passphrase"
									placeholder="Passphrase"
									class="input input-bordered input-sm w-full join-item"
									bind:value={passphrase}
									onkeydown={(e) => e.key === 'Enter' && handleDecrypt()}
								/>
								<button
									class="btn btn-sm btn-primary join-item"
									onclick={handleDecrypt}
									disabled={isDecrypting}
								>
									{#if isDecrypting}
										<span class="loading loading-spinner loading-xs"></span>
									{:else}
										Unlock
									{/if}
								</button>
							</div>
							{#if decryptError}
								<div class="text-error text-xs mt-1">{decryptError}</div>
							{/if}
						</div>
					{:else}
						<div class="alert alert-success py-2 text-xs flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="stroke-current shrink-0 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
							<span>Key Unlocked</span>
						</div>
					{/if}

					<div class="mt-4 flex flex-col gap-2">
						<button class="btn btn-sm btn-outline w-full" onclick={switchToPublicKey}>
							Switch to Public Key
						</button>

						<details class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
							<summary class="collapse-title text-xs font-medium">Export Private Key</summary>
							<div class="collapse-content">
								<div class="alert alert-warning text-xs py-2 mb-2">
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
									<span>Warning: Never share your private key!</span>
								</div>
								<CopyableTextarea value={cleanedKey} class="text-xs" fixed />
							</div>
						</details>
					</div>
				{/if}

				<details class="collapse collapse-arrow w-fit">
					<summary class="collapse-title text-xs font-medium py-2 pl-0"> Show Public Key </summary>
					<div class="collapse-content px-0 pt-2">
						<CopyableTextarea
							value={key.toPublic ? key.toPublic().armor() : key.armor()}
							class="text-xs"
							fixed
						/>
					</div>
				</details>
			</div>
			<button
				class="btn btn-sm btn-ghost absolute top-2 right-2"
				onclick={clearKey}
				aria-label="Remove key"
			>
				✕
			</button>
		</div>
	</div>
{:else}
	<CopyableTextarea
		bind:value
		{label}
		{placeholder}
		readonly={false}
		showButtons={true}
		selectAllOnFocus={false}
	/>
{/if}
