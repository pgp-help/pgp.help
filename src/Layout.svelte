<script lang="ts">
	import { navigate } from './lib/router.svelte.js';

	function handleNav(e: MouseEvent) {
		const target = e.currentTarget as HTMLAnchorElement;
		const href = target.getAttribute('href');
		if (href && href.startsWith('/')) {
			e.preventDefault();
			navigate(href);
		}
	}
</script>

<div class="min-h-screen flex flex-col">
	<div class="navbar bg-base-200">
		<div class="navbar-start">
			<a class="btn btn-ghost text-xl" href="/" onclick={handleNav}>PGP Help</a>
		</div>
		<div class="navbar-center hidden sm:flex">
			<p class="text-sm opacity-80">Simple client-side encryption</p>
		</div>
		<div class="navbar-end">
			<a class="btn btn-ghost btn-sm" href="/Guide" onclick={handleNav}> Guide </a>
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
