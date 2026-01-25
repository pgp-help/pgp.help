<script lang="ts">
	import AppIcon from './lib/ui/icons/AppIcon.svelte';

	let { hasSidebar = false, sidebar, children } = $props();
	let isMobileMenuOpen = $state(false);

	const toggleMobileMenu = () => (isMobileMenuOpen = !isMobileMenuOpen);
</script>

<!--
  Root wrapper:
  - min-h-screen: page at least full height
  - md:grid: use grid layout on desktop
  - md:grid-cols-[16rem_1fr]: sidebar 16rem wide + main column
  - md:grid-rows-[5rem_1fr]: top header row (5rem) + content row
-->
<div class="min-h-screen grid grid-rows-[5rem_1fr] md:grid-cols-[20rem_1fr]">
	<!-- Top-left: Brand (desktop) -->
	<div class="hidden md:flex items-center gap-x-3 px-6 border-b border-primary/10 bg-base-200">
		<AppIcon />
		<div class="text-lg font-bold">pgp.<span class="text-primary">help</span></div>
	</div>

	<!-- Top-right: Title -->
	<header class="h-20 flex items-center px-6 sm:px-8 border-b border-primary/10 md:col-start-2">
		<div class="ml-4">
			<h1 class="text-2xl font-bold">Encryption tool</h1>
			<p class="text-sm text-secondary">Secure messaging with OpenPGP</p>
		</div>

		<!-- Mobile brand -->
		<div class="flex items-center gap-x-3 md:hidden">
			<AppIcon />
			<div class="text-lg font-bold">pgp.<span class="text-primary">help</span></div>
		</div>
	</header>

	<!-- Bottom-left: Sidebar (desktop only, always present but may be empty) -->
	<aside class="hidden md:block bg-base-200 border-r border-primary/10">
		{@render sidebar()}
	</aside>

	<!-- Bottom-right: Main content -->
	<main class="md:col-start-2 overflow-hidden">
		{@render children()}
	</main>
</div>

<!-- Mobile FAB + overlay only if sidebar exists -->
{#if hasSidebar}
	<div class="md:hidden fixed bottom-6 right-6 z-50">
		<button class="btn btn-lg btn-circle btn-primary" onclick={toggleMobileMenu}>
			{#if isMobileMenuOpen}
				<span class="text-xl">✕</span>
			{:else}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			{/if}
		</button>
	</div>

	{#if isMobileMenuOpen}
		<!-- Backdrop -->
		<div class="md:hidden fixed inset-0 z-40 bg-black/30" onclick={toggleMobileMenu}></div>

		<!-- Sidebar overlay -->
		<aside class="md:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 bg-base-200 border-r">
			{@render sidebar()}
		</aside>
	{/if}
{/if}
