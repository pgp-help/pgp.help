<script lang="ts">
	import CopyableTextarea from '../lib/ui/CopyableTextarea.svelte';
	import LockIcon from '../lib/ui/icons/LockIcon.svelte';
	import InfoIcon from '../lib/ui/icons/InfoIcon.svelte';
	import publicKey from '../assets/keys/pgphelp.pem?raw';
</script>

<main class="container mx-auto max-w-4xl p-4 h-full overflow-y-auto">
	<div class="space-y-8">
		<!-- Hero Section -->
		<div class="hero min-h-[40vh] emphasis-primary">
			<div class="hero-content text-center">
				<div class="max-w-3xl">
					<h1
						class="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6"
					>
						Get Started with PGP
					</h1>
					<p class="text-xl leading-relaxed max-w-2xl mx-auto opacity-90">
						Send secret messages that only your intended recipient can read.
						<span class="font-semibold text-primary">100% secure, 100% private</span> - all encryption
						happens in your browser.
					</p>
					<div class="mt-8 flex flex-wrap justify-center gap-3">
						<div class="badge badge-outline badge-lg">
							<span class="text-success">●</span>&nbsp;No servers
						</div>
						<div class="badge badge-outline badge-lg">
							<span class="text-success">●</span>&nbsp;No tracking
						</div>
						<div class="badge badge-outline badge-lg">
							<span class="text-success">●</span>&nbsp;No data collection
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Send a PGP Message -->
		<div class="card emphasis-secondary">
			<div class="card-body">
				<h2 class="card-title text-3xl mb-4">Send a PGP Message</h2>
				<p class="mb-4">
					If you want to send an encrypted message and already have the recipient's PGP key, it's
					really simple:
				</p>
				<ul class="steps steps-vertical lg:steps-horizontal w-full">
					<li class="step step-primary">Paste their PGP key into the form</li>
					<li class="step step-primary">Type your message</li>
					<li class="step step-primary">Copy the encrypted result</li>
					<li class="step step-primary">Send it to your recipient</li>
				</ul>
				<div class="divider"></div>
				<h3 class="font-bold text-lg">Don't have a PGP key?</h3>
				<p>
					You need to ask your recipient for their key, or suggest they go to <a
						href="/"
						class="link link-primary">pgp.help</a
					> to generate one themselves.
				</p>

				<div class="alert alert-info mt-6">
					<InfoIcon />
					<div>
						<h4 class="font-bold">Don't have someone to message?</h4>
						<p>Try sending us a message using our key below - we'd love to hear from you!</p>
					</div>
				</div>
			</div>
		</div>

		<!-- What is PGP - Simplified -->
		<div class="card content-section">
			<div class="card-body">
				<h2 class="card-title text-3xl mb-4">What is PGP?</h2>

				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<h3 class="text-xl font-bold mb-3 text-primary">Think of it like a digital lock box</h3>
						<p class="mb-4 leading-relaxed">
							Imagine you have a special lock box that only one person has the key to. PGP works the
							same way, but with digital messages.
						</p>
						<ul class="space-y-2">
							<li class="flex items-center gap-2">
								<span class="badge badge-success badge-sm">✓</span>
								<span>You put your message in the "box"</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="badge badge-success badge-sm">✓</span>
								<span>It gets scrambled (encrypted)</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="badge badge-success badge-sm">✓</span>
								<span>Only your friend can unscramble it</span>
							</li>
						</ul>
					</div>
					<div class="bg-base-200 rounded-2xl p-6">
						<h3 class="text-lg font-bold mb-3">Why use PGP?</h3>
						<div class="space-y-3">
							<div>
								<h4 class="font-semibold">Privacy</h4>
								<p class="text-sm opacity-70">Nobody can read your messages, not even hackers</p>
							</div>
							<div>
								<h4 class="font-semibold">Security</h4>
								<p class="text-sm opacity-70">Military-grade encryption protects your words</p>
							</div>
							<div>
								<h4 class="font-semibold">Authenticity</h4>
								<p class="text-sm opacity-70">
									Proof that the message really came from who you think
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="divider">Learn More</div>
				<p class="mt-2">Learn more about PGP:</p>
				<ul class="list-disc list-inside ml-4 space-y-1">
					<li>
						<a
							href="https://en.wikipedia.org/wiki/Pretty_Good_Privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="link link-primary">Wikipedia: Pretty Good Privacy</a
						>
					</li>
					<li>
						<a
							href="https://www.openpgp.org/"
							target="_blank"
							rel="noopener noreferrer"
							class="link link-primary">OpenPGP.org</a
						>
					</li>
					<li>
						<a
							href="https://gnupg.org/"
							target="_blank"
							rel="noopener noreferrer"
							class="link link-primary">GnuPG.org</a
						>
					</li>
					<li>
						<a
							href="https://age-encryption.org/"
							target="_blank"
							rel="noopener noreferrer"
							class="link link-primary">AGE Encryption</a
						>
					</li>
				</ul>
			</div>
		</div>

		<!-- FAQ -->
		<div class="card content-section">
			<div class="card-body">
				<h2 class="card-title text-3xl mb-6">FAQ</h2>

				<div class="space-y-4">
					<div class="collapse collapse-plus bg-base-200">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">Is this website safe to use?</div>
						<div class="collapse-content">
							<p class="mb-3">
								<span class="badge badge-success mb-2">100% Safe</span><br />
								<strong>Everything happens in your browser.</strong> Your messages never leave your computer.
							</p>
							<div class="grid md:grid-cols-2 gap-4">
								<div class="flex items-start gap-2">
									<span class="text-success">✅</span>
									<div>
										<strong>No servers involved</strong><br />
										<span class="text-sm opacity-70">All encryption is done locally</span>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-success">✅</span>
									<div>
										<strong>No data collection</strong><br />
										<span class="text-sm opacity-70">We can't see what you encrypt</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">Can you steal my data?</div>
						<div class="collapse-content">
							<p class="mb-3">
								<span class="badge badge-error mb-2">Impossible</span><br />
								This website is designed so it <strong>cannot</strong> send your data anywhere.
							</p>
							<div class="alert alert-info">
								<InfoIcon />
								<div>
									<h4 class="font-bold">Technical Details</h4>
									<p class="text-sm">
										We use Content Security Policy (CSP) headers that tell your browser: "Don't let
										this page send ANY data over the internet." You can check this for yourself in
										developer tools.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">What if the website gets hacked?</div>
						<div class="collapse-content">
							<p class="mb-4">
								While we work hard to keep this website secure, you can take extra precautions:
							</p>
							<div class="card bg-primary/5 border border-primary/20">
								<div class="card-body">
									<h3 class="card-title text-lg">Download for Maximum Security</h3>
									<p>
										Download this website to your computer and run it offline. Since everything
										works in your browser, you'll have the same functionality with zero internet
										risk.
									</p>
									<p class="mt-3 text-sm opacity-75">Recommended for sensitive data</p>
								</div>
							</div>
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">Is it safe to save my keys here?</div>
						<div class="collapse-content">
							<p class="mb-3">
								<span class="badge badge-success mb-2">Generally Safe</span><br />
								Keys are stored in your browser's local storage - like a private folder only this website
								can access.
							</p>
							<div class="alert alert-warning">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="stroke-current shrink-0 w-6 h-6"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z"
									></path>
								</svg>
								<div>
									<h4 class="font-bold">Special Case: Local Files</h4>
									<p class="text-sm">
										If you're running this from a downloaded file (file:// address), other local
										files might be able to access the storage. For better isolation, use the web
										version or a local web server.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">
							What's the difference between PGP and AGE?
						</div>
						<div class="collapse-content">
							<div class="grid md:grid-cols-2 gap-6">
								<div class="card bg-base-100">
									<div class="card-body">
										<h3 class="card-title text-lg">PGP (Traditional)</h3>
										<ul class="text-sm space-y-1">
											<li>✅ Widely supported</li>
											<li>✅ Time-tested (30+ years)</li>
											<li>✅ Email integration</li>
											<li>⚠️ More complex</li>
										</ul>
									</div>
								</div>
								<div class="card bg-base-100">
									<div class="card-body">
										<h3 class="card-title text-lg">AGE (Modern)</h3>
										<ul class="text-sm space-y-1">
											<li>✅ Simpler to use</li>
											<li>✅ Modern crypto</li>
											<li>✅ Smaller keys</li>
											<li>⚠️ Newer (less common)</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Contact & Key -->
		<div class="card emphasis-accent">
			<div class="card-body">
				<h2 class="card-title text-3xl mb-4">Want to Try It Out?</h2>
				<p class="text-lg mb-6">
					Ready to test your new PGP skills? We'd love to receive an encrypted message from you!
				</p>

				<div class="grid md:grid-cols-2 gap-6 mb-6">
					<div class="space-y-4">
						<div class="flex flex-col gap-2">
							<p>
								📧 Email us at: <a href="mailto:hello@pgp.help" class="link link-primary font-mono"
									>hello@pgp.help</a
								>
							</p>
							<p>✨ We respond to every encrypted message!</p>
						</div>
					</div>
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h3 class="card-title text-lg">Quick Start</h3>
							<p class="text-sm mb-3">Use our public key to write us a message right now:</p>
							<a href="/?key={encodeURIComponent(publicKey)}" class="btn btn-primary btn-block">
								<LockIcon class="w-4 h-4" />
								Write Encrypted Message
							</a>
						</div>
					</div>
				</div>

				<div class="divider">Our Public Key</div>

				<div class="form-control">
					<CopyableTextarea
						value={publicKey}
						readonly={true}
						fixed={true}
						label="PGP Public Key - Copy this to encrypt messages for us"
						buttons={true}
					/>
				</div>
			</div>
		</div>

		<!-- About -->
		<div class="card content-section">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">About pgp.help</h2>
				<p class="mb-4">This project is open source and built with:</p>
				<ul class="list-disc list-inside ml-4 space-y-1">
					<li><a href="https://svelte.dev" class="link link-secondary">Svelte</a></li>
					<li><a href="https://openpgpjs.org/" class="link link-secondary">OpenPGP.js</a></li>
					<li>
						<a href="https://daisyui.com/" class="link link-secondary">DaisyUI</a> &
						<a href="https://tailwindcss.com/" class="link link-secondary">Tailwind CSS</a>
					</li>
				</ul>
				<p class="mt-4 text-sm opacity-75">
					Most components are MIT licensed. OpenPGP.js is LGPL. Please refer to the source code for
					full details.
				</p>
			</div>
		</div>
	</div>
</main>
