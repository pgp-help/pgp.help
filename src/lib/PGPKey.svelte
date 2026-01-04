<script lang="ts">
	import { getKeyDetails } from './pgp';
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

	$effect(() => {
		const k = value;
		if (!k) {
			key = null;
			cleanedKey = '';
			expirationTime = null;
			return;
		}

		getKeyDetails(k).then(async (details) => {
			if (value === k) {
				if (details) {
					key = details;
					cleanedKey = details.armor();
					//For whatever reason, expirationTime is a promise. So fetch that too.
					expirationTime = (await details.getExpirationTime()) as Date | null;
				} else {
					key = null;
					cleanedKey = '';
					expirationTime = null;
				}
			}
		});
	});

	function clearKey() {
		value = '';
		cleanedKey = '';
		key = null;
		expirationTime = null;
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

				<details class="collapse collapse-arrow mt-4 p-0">
					<summary class="collapse-title text-xs font-medium min-h-0 py-2 pl-0">
						Show Armored Key
					</summary>
					<div class="collapse-content px-0 pt-2">
						<CopyableTextarea value={cleanedKey} readonly={true} label="" />
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
