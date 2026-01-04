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
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="form-control">
			<label class="label" for="key">
				<span class="label-text font-semibold">Public Key</span>
			</label>
			<textarea
				id="key"
				bind:value={key}
				placeholder="Paste Public Key (Armored)..."
				rows="10"
				class="textarea textarea-bordered textarea-lg font-mono text-sm"
			></textarea>
		</div>

		<div class="form-control">
			<label class="label" for="message">
				<span class="label-text font-semibold">Message</span>
			</label>
			<textarea
				id="message"
				bind:value={message}
				placeholder="Type your secret message..."
				rows="10"
				class="textarea textarea-bordered textarea-lg"
			></textarea>
		</div>
	</div>

	<div class="divider my-8"></div>

	<div class="form-control">
		<label class="label" for="output">
			<span class="label-text font-semibold">Encrypted Message</span>
		</label>
		<textarea
			id="output"
			value={output}
			readonly
			placeholder="Encrypted output will appear here..."
			rows="10"
			aria-busy={isEncrypting}
			class="textarea textarea-bordered textarea-lg font-mono text-sm"
		></textarea>
		{#if isEncrypting}
			<div class="mt-4 flex items-center gap-2">
				<span class="loading loading-spinner loading-sm"></span>
				<span class="text-sm text-base-content/70">Encrypting...</span>
			</div>
		{/if}
	</div>
</Layout>
