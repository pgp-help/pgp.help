<script lang="ts">
	import Layout from './Layout.svelte';
	import PGPPage from './routes/PGPPage.svelte';
	import PGPSidebar from './routes/PGPSidebar.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, Pages } from './routes/router.svelte.js';
	import type { KeyWrapper } from './lib/pgp/keyStore.svelte';

	let selectedKeyWrapper: KeyWrapper | null = $state(null);
</script>

{#if router.activeRoute.page === Pages.GUIDE}
	<Layout>
		{#snippet sidebar()}
			<div></div>
		{/snippet}
		<Guide />
	</Layout>
{:else}
	<Layout hasSidebar>
		{#snippet sidebar()}
			<PGPSidebar bind:selectedKeyWrapper />
		{/snippet}

		<PGPPage bind:selectedKeyWrapper />
	</Layout>
{/if}
