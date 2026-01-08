<script>
</script>

<main class="flex-1 overflow-y-auto p-4 sm:p-8">
	<div class="container mx-auto max-w-4xl">
		<div class="space-y-6">
			<div class="hero bg-base-200 rounded-box">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">PGP Help</h1>
						<p class="py-6">
							Secure client-side encryption made simple. Learn how to protect your communications.
						</p>
					</div>
				</div>
			</div>

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<h2 class="card-title">What is PGP?</h2>
					<p>
						PGP (Pretty Good Privacy) is an encryption program that provides cryptographic privacy
						and authentication for data communication. It is used for signing, encrypting, and
						decrypting texts, e-mails, files, directories, and whole disk partitions and to increase
						the security of e-mail communications.
					</p>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-6">
				<!-- Encrypt Card -->
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<h2 class="card-title text-primary">Encrypting</h2>
						<ul class="steps steps-vertical w-full">
							<li class="step step-primary"><span>Paste recipient's <b>Public Key</b></span></li>
							<li class="step step-primary"><span>Type your secret message</span></li>
							<li class="step step-primary"><span>Copy the encrypted output</span></li>
							<li class="step step-primary"><span>Send to recipient</span></li>
						</ul>
					</div>
				</div>

				<!-- Decrypt Card -->
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<h2 class="card-title text-secondary">Decrypting</h2>
						<ul class="steps steps-vertical w-full">
							<li class="step step-secondary">
								<span>Paste your <strong>Private Key</strong></span>
							</li>
							<li class="step step-secondary"><span>Unlock key (if needed)</span></li>
							<li class="step step-secondary"><span>Paste encrypted message</span></li>
							<li class="step step-secondary"><span>Read decrypted text</span></li>
						</ul>
					</div>
				</div>
			</div>

			<div role="alert" class="alert alert-info shadow-lg">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-current shrink-0 w-6 h-6"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
				<div>
					<h3 class="font-bold">Privacy Notice</h3>
					<div>
						This application runs entirely in your browser. Your keys and messages are <b>never</b> sent
						to any server.
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
