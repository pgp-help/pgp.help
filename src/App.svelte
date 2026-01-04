<script>
	import { encryptMessage } from './lib/pgp.js';
	import Layout from './Layout.svelte';

	let key = $state('');
	let message = $state('');
	let output = $state('');
	let isEncrypting = $state(false);

	$effect(() => {
		const k = key;
		const m = message;

		if (!k || !m) {
			output = '';
			return;
		}

		isEncrypting = true;
		encryptMessage(k, m).then((result) => {
			if (key === k && message === m) {
				output = result;
				isEncrypting = false;
			}
		});
	});
</script>

<Layout>
	<form class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<fieldset class="fieldset">
			<legend class="fieldset-legend">Public Key</legend>
			<textarea
				class="textarea textarea-bordered w-full h-64"
				bind:value={key}
				placeholder="Paste Public Key (Armored)..."
			></textarea>
		</fieldset>

		<fieldset class="fieldset">
			<legend class="fieldset-legend">Message</legend>
			<textarea
				class="textarea textarea-bordered w-full h-64"
				bind:value={message}
				placeholder="Type your secret message..."
			></textarea>
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
		<textarea
			class="textarea textarea-bordered w-full h-64"
			value={output}
			readonly
			disabled
			placeholder="Encrypted output will appear here..."
			aria-busy={isEncrypting}
		></textarea>
	</fieldset>
</Layout>
