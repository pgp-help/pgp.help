<script lang="ts">
	import { navigate } from './lib/router.svelte.js';
	import KeySidebar from './lib/KeySidebar.svelte';

	// Intercept link clicks to use client-side routing instead of full page reload
	function handleNav(e: MouseEvent) {
		const target = e.currentTarget as HTMLAnchorElement;
		const href = target.getAttribute('href');
		if (href && href.startsWith('/')) {
			e.preventDefault();
			navigate(href);
		}
	}
</script>

<div class="h-screen flex flex-col overflow-hidden">
	<div class="navbar bg-base-200 flex-none z-10">
		<div class="navbar-start">
			<a class="btn btn-ghost text-xl" href="/" onclick={handleNav}>pgp.help</a>
		</div>
		<div class="navbar-center hidden sm:flex">
			<p class="text-sm opacity-80">Simple secure client-side encryption</p>
		</div>
		<div class="navbar-end">
			<a class="btn btn-ghost btn-sm" href="/Guide" onclick={handleNav}> Guide </a>
		</div>
	</div>

	<div class="flex flex-1 overflow-hidden">
		<aside class="hidden md:block h-full overflow-hidden" aria-label="Sidebar">
			<KeySidebar />
		</aside>

		<main class="flex-1 overflow-y-auto p-4 sm:p-8">
			<div class="container mx-auto max-w-4xl">
				<slot />
			</div>

			<footer class="footer footer-center p-4 mt-8 text-base-content/50">
				<aside>
					<p>
						View source on
						<a
							class="link link-hover link-primary"
							href="https://github.com/pgp-help/pgp.svelte"
							rel="noopener"
						>
							GitHub
						</a>
					</p>
				</aside>
			</footer>
		</main>
	</div>
</div>
