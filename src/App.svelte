<script>
	import { encryptMessage } from './lib/pgp.js';
	import Layout from './Layout.svelte';
	import CopyableTextarea from './lib/CopyableTextarea.svelte';
	import PGPKey from './lib/PGPKey.svelte';

	let keyInput = $state('');
	let keyObject = $state(null);
	let message = $state('');
	let output = $state('');
	let isEncrypting = $state(false);

	$effect(() => {
		const k = keyObject;
		const m = message;

		if (!k || !m) {
			output = '';
			return;
		}

		isEncrypting = true;
		encryptMessage(k, m).then((result) => {
			if (keyObject === k && message === m) {
				output = result;
				isEncrypting = false;
			}
		});
	});
</script>

<Layout>
	<form class="space-y-6">
		<fieldset class="fieldset">
			<legend class="fieldset-legend">Public Key</legend>
			<PGPKey bind:value={keyInput} bind:key={keyObject} label="Public Key" />
		</fieldset>

		<div class="divider"></div>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Message</legend>
			<CopyableTextarea
				bind:value={message}
				placeholder="Type your secret message..."
				label="Message"
				selectAllOnFocus={false}
			/>
		</fieldset>
	</form>

	<div class="divider"></div>

	<fieldset class="fieldset">
		<legend class="fieldset-legend">
			Encrypted Message
			{#if isEncrypting}
				<span class="loading loading-spinner loading-sm ml-2"></span>
			{/if}
		</legend>
		<CopyableTextarea
			value={output}
			readonly={true}
			placeholder="Encrypted output will appear here..."
			label="Encrypted Message"
		/>
	</fieldset>
</Layout>
