<script lang="ts">
	import { generateKeyPair } from './pgp';
	import { generateKeyPair as generateAGEKeyPair } from './age';
	import { type CryptoKey, getKeyDetails, KeyType } from './crypto';

	interface Props {
		onKeyGenerated: (key: CryptoKey) => void;
		onCancel: () => void;
	}

	let { onKeyGenerated, onCancel }: Props = $props();

	let keyType = $state<KeyType>(KeyType.PGP);
	let name = $state('');
	let email = $state('');
	let passphrase = $state('');
	let error = $state('');

	let isPassphraseComplex = $derived(passphrase.length >= 8);

	async function handleGenerate(e: Event) {
		e.preventDefault();

		error = '';

		try {
			if (keyType === KeyType.PGP) {
				const keyPair = await generateKeyPair(name, email, passphrase);
				const privateKeyObj = await getKeyDetails(keyPair.privateKey);
				onKeyGenerated(privateKeyObj);
			} else {
				const keyPair = await generateAGEKeyPair();
				const privateKeyObj = await getKeyDetails(keyPair.privateKey);
				onKeyGenerated(privateKeyObj);
			}
		} catch (err) {
			error = (err as Error).message;
		}
	}

	function fillAnonymous() {
		name = 'Anonymous';
		email = `${Math.random().toString(36).substring(2)}@anonymous.local`;
	}
</script>

<div class="container mx-auto max-w-2xl">
	<div class="emphasis-primary p-8 mb-6">
		<h1 class="text-3xl font-bold text-center">Generate New Key</h1>
		<p class="text-center text-lg opacity-90 mt-2">
			Create a secure cryptographic key for encryption
		</p>
	</div>

	<form class="content-section p-6 space-y-4" onsubmit={handleGenerate}>
		<div class="form-control w-full">
			<label class="label" for="type">
				<span class="label-text">Key Type</span>
			</label>
			<select bind:value={keyType} class="select select-bordered w-full">
				<option value={KeyType.PGP}>PGP (Pretty Good Privacy)</option>
				<option value={KeyType.AGE}>AGE (Modern, Simple)</option>
			</select>
		</div>

		{#if keyType === KeyType.PGP}
			<div class="form-control w-full">
				<label class="label" for="name">
					<span class="label-text">Name</span>
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="John Doe"
					class="input input-bordered w-full"
					required
				/>
			</div>

			<div class="form-control w-full">
				<label class="label" for="email">
					<span class="label-text">Email</span>
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="john@example.com"
					class="input input-bordered w-full"
					required
				/>
			</div>

			<div class="flex justify-end">
				<button type="button" class="btn btn-ghost" onclick={fillAnonymous}
					>Fill with anonymous details</button
				>
			</div>

			<div class="form-control w-full">
				<label class="label" for="passphrase">
					<span class="label-text">Passphrase (Optional but Recommended)</span>
				</label>

				<div
					class="alert {isPassphraseComplex
						? 'alert-success opacity-70'
						: 'alert-warning'} text-sm py-2 mb-2 transition-all"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/></svg
					>
					<span>
						{isPassphraseComplex
							? 'Passphrase strength is good.'
							: 'The security of your key depends heavily on the complexity of your passphrase.'}
					</span>
				</div>

				<input
					type="password"
					id="passphrase"
					bind:value={passphrase}
					placeholder="Enter a strong passphrase..."
					class="input input-bordered w-full"
				/>
			</div>
		{:else}
			<div class="alert alert-info">
				<span>
					AGE keys are simple and modern. They don't store personal information like Name or Email,
					and they don't support passphrases in this generator (they are just random keys).
				</span>
			</div>
		{/if}

		{#if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{/if}

		<div class="flex justify-end gap-2 mt-6">
			<button type="button" class="btn btn-ghost" onclick={onCancel}>Cancel</button>
			<button type="submit" class="btn btn-primary">Generate Key</button>
		</div>
	</form>
</div>
