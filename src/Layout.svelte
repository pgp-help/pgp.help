<div class="min-h-screen flex flex-col">
	<div class="navbar bg-base-200">
		<div class="navbar-start">
			<a class="btn btn-ghost text-xl" href="/">PGP Help</a>
		</div>
		<div class="navbar-center hidden sm:flex">
			<p class="text-sm text-base-content/70">Simple client-side encryption</p>
		</div>
		<div class="navbar-end">
			<a class="btn btn-ghost btn-sm" href="https://pgp.help" target="_blank" rel="noopener">
				Help
			</a>
		</div>
	</div>

	<main class="flex-1 container mx-auto max-w-6xl py-8">
		<slot />
	</main>

	<footer class="footer footer-center bg-base-200 p-4">
		<aside>
			<p>
				View source on
				<a
					class="link link-hover link-primary"
					href="https://github.com/yourusername/pgp-svelte-wsl"
					target="_blank"
					rel="noopener"
				>
					GitHub
				</a>
			</p>
		</aside>
	</footer>
</div>
