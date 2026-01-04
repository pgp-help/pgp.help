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
	<div class="grid">
		<div>
			<label for="key">
				Public Key
				<textarea id="key" bind:value={key} placeholder="Paste Public Key (Armored)..." rows="10"
				></textarea>
			</label>
		</div>

		<div>
			<label for="message">
				Message
				<textarea
					id="message"
					bind:value={message}
					placeholder="Type your secret message..."
					rows="10"
				></textarea>
			</label>
		</div>
	</div>

	<hr />

	<label for="output">
		Encrypted Message
		<textarea
			id="output"
			value={output}
			readonly
			placeholder="Encrypted output will appear here..."
			rows="10"
			aria-busy={isEncrypting}
		></textarea>
	</label>
</Layout>
