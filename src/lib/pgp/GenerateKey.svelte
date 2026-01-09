<script lang="ts">
	import { generateKeyPair, getKeyDetails } from './pgp';
	import { router } from '../router.svelte.js';
	import { keyStore } from './keyStore.svelte.js';
	import CopyableTextarea from '../ui/CopyableTextarea.svelte';
	import CopyButtons from '../ui/CopyButtons.svelte';
	import KeySidebar from './KeySidebar.svelte';

	let name = $state('');
	let email = $state('');
	let passphrase = $state('');
	let isGenerating = $state(false);
	let error = $state('');
	let generatedKey = $state<{
		privateKey: string;
		publicKey: string;
		revocationCertificate: string;
	} | null>(null);

	async function handleGenerate(e: Event) {
		e.preventDefault();
		if (!name || !email) {
			error = 'Name and Email are required.';
			return;
		}

		isGenerating = true;
		error = '';

		try {
			const keyPair = await generateKeyPair(name, email, passphrase);
			generatedKey = keyPair;

			// Automatically add the generated keys to the store
			const privateKeyObj = await getKeyDetails(keyPair.privateKey);
			await keyStore.addKey(privateKeyObj);
		} catch (err) {
			error = (err as Error).message;
		} finally {
			isGenerating = false;
		}
	}

	function handleDone() {
		if (generatedKey) {
			// Navigate to the new key
			getKeyDetails(generatedKey.privateKey).then((key) => {
				router.openKey(key.getFingerprint());
			});
		} else {
			router.openHome();
		}
	}
</script>

<aside aria-label="Sidebar">
	<KeySidebar />
</aside>

<main class="flex-1 overflow-y-auto p-4 sm:p-8" aria-label="Generate Key">
	<div class="container mx-auto max-w-2xl">
		<h1 class="text-2xl font-bold mb-6">Generate New PGP Key</h1>

		{#if !generatedKey}
			<div class="alert alert-warning mb-6">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/></svg
				>
				<div>
					<h3 class="font-bold">Security Warning</h3>
					<div class="text-sm">
						<p>The security of your key depends heavily on the complexity of your passphrase.</p>
						<p class="mt-1">
							Please store your private key and revocation certificate in a safe place. <strong
								>If you lose your private key or passphrase, it CANNOT be recovered.</strong
							>
						</p>
						<p class="mt-2">
							<a
								href="https://www.gnupg.org/gph/en/manual/c14.html"
								target="_blank"
								rel="noopener noreferrer"
								class="link">Learn more about PGP key security</a
							>
						</p>
					</div>
				</div>
			</div>

			<form class="space-y-4" onsubmit={handleGenerate}>
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
						disabled={isGenerating}
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
						disabled={isGenerating}
					/>
				</div>

				<div class="form-control w-full">
					<label class="label" for="passphrase">
						<span class="label-text">Passphrase (Optional but Recommended)</span>
					</label>
					<input
						type="password"
						id="passphrase"
						bind:value={passphrase}
						placeholder="Enter a strong passphrase..."
						class="input input-bordered w-full"
						disabled={isGenerating}
					/>
				</div>

				{#if error}
					<div class="alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="flex justify-end gap-2 mt-6">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => router.openHome()}
						disabled={isGenerating}>Cancel</button
					>
					<button type="submit" class="btn btn-primary" disabled={isGenerating}>
						Generate Key
					</button>
				</div>
			</form>
		{:else}
			<div class="space-y-6">
				<div class="alert alert-success">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span>Key generated successfully! It has been added to your keychain.</span>
				</div>

				<div class="alert alert-info">
					<span
						>Please save these keys securely. You will not be able to see the private key again if
						you clear your browser data.</span
					>
				</div>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Private Key</legend>
					<CopyableTextarea value={generatedKey.privateKey} readonly={true} label="Private Key">
						{#snippet buttons()}
							<CopyButtons value={generatedKey!.privateKey} />
						{/snippet}
					</CopyableTextarea>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Public Key</legend>
					<CopyableTextarea value={generatedKey.publicKey} readonly={true} label="Public Key">
						{#snippet buttons()}
							<CopyButtons value={generatedKey!.publicKey} />
						{/snippet}
					</CopyableTextarea>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Revocation Certificate</legend>
					<CopyableTextarea
						value={generatedKey.revocationCertificate}
						readonly={true}
						label="Revocation Certificate"
					>
						{#snippet buttons()}
							<CopyButtons value={generatedKey!.revocationCertificate} />
						{/snippet}
					</CopyableTextarea>
				</fieldset>

				<div class="flex justify-end mt-6">
					<button class="btn btn-primary" onclick={handleDone}>Done</button>
				</div>
			</div>
		{/if}
	</div>
</main>
