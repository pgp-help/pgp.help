<script lang="ts">
	import CopyableTextarea from '../lib/ui/CopyableTextarea.svelte';
	import CopyButtons from '../lib/ui/CopyButtons.svelte';
	import publicKey from '../assets/keys/pgphelp.pem?raw';
</script>

<main class="container mx-auto max-w-4xl p-4 h-full overflow-y-auto">
	<div class="space-y-8">
		<!-- Hero Section -->
		<div class="hero bg-base-200 rounded-box">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Get Started with PGP</h1>
					<p class="py-6">
						Securely encrypt messages in your browser. No server, no tracking, just privacy.
					</p>
				</div>
			</div>
		</div>

		<!-- How to Send -->
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Send a PGP Message</h2>
				<p class="mb-4">
					If you want to send an encrypted message and already have the recipient's PGP key, it’s
					really simple:
				</p>
				<ul class="steps steps-vertical lg:steps-horizontal w-full">
					<li class="step step-primary">Paste their PGP key into the form</li>
					<li class="step step-primary">Type your message</li>
					<li class="step step-primary">Copy the encrypted result</li>
					<li class="step step-primary">Send it to your recipient</li>
				</ul>
				<div class="divider"></div>
				<h3 class="font-bold text-lg">Don’t have a PGP key?</h3>
				<p>
					You need to ask your recipient for their key, or suggest they go to <a
						href="/"
						class="link link-primary">pgp.help</a
					> to generate one themselves.
				</p>
			</div>
		</div>

		<!-- What is PGP -->
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-2xl">What is PGP?</h2>
				<p>
					PGP (Pretty Good Privacy) uses public key cryptography to allow you to send and receive
					encrypted messages. It ensures that only the intended recipient can read your message.
				</p>
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
				</ul>
			</div>
		</div>

		<!-- Security FAQ -->
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Security & Privacy FAQ</h2>

				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" checked />
					<div class="collapse-title text-xl font-medium">How secure is this website?</div>
					<div class="collapse-content">
						<p>
							This website is designed with security in mind. <strong
								>No data is sent over the internet.</strong
							> Key data is (optionally) retained within your browser's local storage but nowhere else.
						</p>
					</div>
				</div>

				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" checked />
					<div class="collapse-title text-xl font-medium">Can this site steal my data?</div>
					<div class="collapse-content">
						<p class="mb-2"><strong>No!</strong></p>
						<p class="mb-2">
							This site uses Content Security Policy (CSP) headers to prohibit your browser from
							sending any data from this page over the internet. You can verify this by inspecting
							the page source.
						</p>
						<p>
							The policy <code>default-src 'none'</code> ensures that no external resources are loaded
							and no data can be exfiltrated.
						</p>
					</div>
				</div>

				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" checked />
					<div class="collapse-title text-xl font-medium">Could the site be hacked?</div>
					<div class="collapse-content">
						<p class="mb-2">
							While we take steps to keep the site secure, it is theoretically possible for any
							website to be compromised.
						</p>
						<p>
							For maximum security, you can <strong>download a copy of this website</strong> and run it
							offline. Since the encryption happens entirely in your browser, it works perfectly without
							an internet connection.
						</p>
					</div>
				</div>

				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" checked />
					<div class="collapse-title text-xl font-medium">Is it safe to store key data?</div>
					<div class="collapse-content">
						<p class="mb-2">
							Generally yes. HTML5 local storage is visible only to pages loaded from the same
							origin.
						</p>
						<p>
							However, if you are running this from a local file (<code>file://</code>), be aware
							that other local files might be able to access this storage. We recommend using a
							local web server or the hosted version for better isolation.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Contact & Key -->
		<div class="card bg-base-100 shadow-sm border-2 border-primary">
			<div class="card-body">
				<h2 class="card-title text-2xl">Contact Us</h2>
				<p>If you want to try out PGP, why not use our key to send us a message?</p>
				<p>
					You can email us at <a href="mailto:hello@pgp.help" class="link link-primary"
						>hello@pgp.help</a
					>
				</p>
				<p>
					<a href="/?key={encodeURIComponent(publicKey)}" class="link link-primary"
						>Write an Encrypted Message for us</a
					>
				</p>

				<div class="divider">Our Public Key</div>

				<div class="form-control">
					<CopyableTextarea value={publicKey} readonly={true} fixed={true} label="PGP Public Key">
						{#snippet buttons()}
							<CopyButtons value={publicKey} />
						{/snippet}
					</CopyableTextarea>
				</div>
			</div>
		</div>

		<!-- About -->
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-xl">About pgp.help</h2>
				<p>This project is open source and built with:</p>
				<ul class="list-disc list-inside ml-4">
					<li><a href="https://svelte.dev" class="link link-secondary">Svelte</a></li>
					<li><a href="https://openpgpjs.org/" class="link link-secondary">OpenPGP.js</a></li>
					<li>
						<a href="https://daisyui.com/" class="link link-secondary">DaisyUI</a> & Tailwind CSS
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
