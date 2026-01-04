<script lang="ts">
	import { getKeyDetails } from './pgp';
	import type { Key } from 'openpgp';
	import CopyableTextarea from './CopyableTextarea.svelte';

	let {
		value = $bindable(''),
		label = '',
		placeholder = '',
		readonly = false,
		rows = 10,
		showButtons = true,
		selectAllOnFocus = true
	} = $props();

	let key = $state<Key | null>(null);
	let creationTime = $state<Date | null>(null);
	let expirationTime = $state<Date | null>(null);
	let algorithmInfo = $state<{ algorithm: string; bits: number } | null>(null);

	$effect(() => {
		const k = value;
		if (!k) {
			key = null;
			return;
		}

		getKeyDetails(k).then(async (details) => {
			if (value === k) {
				key = details;
				if (key) {
					creationTime = key.getCreationTime();
					expirationTime = (await key.getExpirationTime()) as Date | null;
					// @ts-expect-error - getAlgorithmInfo types might be missing in some versions but exists at runtime
					algorithmInfo = key.getAlgorithmInfo ? key.getAlgorithmInfo() : null;
				}
			}
		});
	});

	function clearKey() {
		value = '';
		key = null;
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (date === (Infinity as any)) return 'Never';
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	let properties = $derived(
		key
			? [
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
						value: formatDate(creationTime),
						tooltip: 'When this key was generated'
					},
					{
						label: 'Expires',
						value: formatDate(expirationTime),
						tooltip: 'When this key will no longer be valid'
					},
					...(algorithmInfo
						? [
								{
									label: 'Type',
									value: `${algorithmInfo.algorithm.toUpperCase()} ${algorithmInfo.bits ? `(${algorithmInfo.bits} bit)` : ''}`,
									tooltip: 'The cryptographic algorithm and key size'
								}
							]
						: [])
				]
			: []
	);
</script>

{#if key}
	<div class="card bg-base-200 shadow-md border border-base-300 relative group">
		<div class="card-body p-4">
			<div class="flex justify-between items-start">
				<div class="w-full">
					<div class="flex items-center gap-2 mb-1">
						<h4 class="font-bold text-lg">{key.getUserIDs()[0] || 'Unknown User'}</h4>
						<span class="badge {key.isPrivate() ? 'badge-secondary' : 'badge-primary'} badge-sm">
							{key.isPrivate() ? 'Private Key' : 'Public Key'}
						</span>
					</div>

					{#each properties as prop (prop.label)}
						<div class="text-xs font-mono opacity-70 flex items-start gap-1">
							<div class="tooltip tooltip-right" data-tip={prop.tooltip}>
								<span class="cursor-help border-b border-dotted border-base-content/50"
									>{prop.label}</span
								>:
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
							<CopyableTextarea {value} readonly={true} rows={6} label="" placeholder="" />
						</div>
					</details>
				</div>
				<button
					class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
					onclick={clearKey}
					aria-label="Remove key"
				>
					✕
				</button>
			</div>
		</div>
	</div>
{:else}
	<CopyableTextarea
		bind:value
		{label}
		{placeholder}
		{readonly}
		{rows}
		{showButtons}
		{selectAllOnFocus}
	/>
{/if}
