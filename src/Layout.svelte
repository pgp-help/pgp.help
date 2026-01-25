<script lang="ts">
	import AppIcon from './lib/ui/icons/AppIcon.svelte';

	export let hasSidebar = false;
	let isMobileMenuOpen = false;

	const toggleMobileMenu = () => (isMobileMenuOpen = !isMobileMenuOpen);
</script>

<!--
  Root wrapper:
  - min-h-screen: page at least full height
  - md:grid: use grid layout on desktop
  - md:grid-cols-[16rem_1fr]: sidebar 16rem wide + main column
  - md:grid-rows-[5rem_1fr]: top header row (5rem) + content row
-->
<div
	class={`min-h-screen ${hasSidebar ? 'md:grid md:grid-cols-[20rem_1fr] md:grid-rows-[5rem_1fr]' : ''}`}
>
	{#if hasSidebar}
		<!--
      Sidebar top row (desktop only):
      - hidden md:flex: only visible on desktop
      - h-20: 5rem height (matches main header)
      - border-b: draws the line that aligns with main header
      - bg-base-200: sidebar background
    -->
		<div
			class="hidden md:flex items-center gap-x-3 h-20 px-6 border-b border-primary/10 bg-base-200"
		>
			<AppIcon />
			<div class="text-lg font-bold">
				pgp.<span class="text-primary">help</span>
			</div>
		</div>
	{/if}

	<!--
		Main header row:
		- h-20: same height as sidebar top row
		- border-b: aligns bottom border
		- md:col-start-2: if sidebar exists, header goes in right column
	-->
	<header
		class={`h-20 flex items-center px-6 sm:px-8 border-b border-primary/10 z-20 
	${hasSidebar ? 'md:col-start-2' : ''}`}
	>
		{#if hasSidebar}
			<div class="flex items-center gap-x-3 md:hidden">
				<AppIcon />
				<div class="text-lg font-bold">
					pgp.<span class="text-primary">help</span>
				</div>
			</div>
		{/if}

		<div class="ml-4">
			<h1 class="text-2xl font-bold">Encryption tool</h1>
			<p class="text-sm text-secondary">Secure messaging with OpenPGP</p>
		</div>
	</header>

	{#if hasSidebar}
		<aside class="md:row-start-2 md:col-start-1 bg-base-200 border-r border-primary/10">
			<slot name="sidebar" />
		</aside>
	{/if}

	<main class={`${hasSidebar ? 'md:row-start-2 md:col-start-2' : ''} overflow-hidden`}>
		<slot />
	</main>
</div>

<!-- Mobile FAB toggle -->
{#if hasSidebar}
	<div class="md:hidden fixed bottom-6 right-6 z-50">
		<button class="btn btn-lg btn-circle btn-primary" on:click={toggleMobileMenu}>
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
{/if}
