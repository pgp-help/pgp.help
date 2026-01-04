<div class="min-h-screen flex flex-col bg-base-100">
	<header class="bg-base-200 border-b border-base-300 shadow-sm">
		<div class="container mx-auto px-4 py-6">
			<div class="flex justify-between items-start">
				<div>
					<h1 class="text-4xl font-bold text-base-content">PGP Help</h1>
					<p class="text-base-content/70 mt-2">Simple client-side encryption.</p>
				</div>
				<nav>
					<a href="https://pgp.help" target="_blank" rel="noopener" class="link link-primary">
						Help
					</a>
				</nav>
			</div>
		</div>
	</header>

	<main class="flex-1 container mx-auto px-4 py-8">
		<slot />
	</main>

	<footer class="bg-base-200 border-t border-base-300 mt-12">
		<div class="container mx-auto px-4 py-6 text-center text-base-content/70">
			<p>
				View source on <a
					href="https://github.com/yourusername/pgp-svelte-wsl"
					target="_blank"
					rel="noopener"
					class="link link-primary">GitHub</a
				>
			</p>
		</div>
	</footer>
</div>
