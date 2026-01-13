<script lang="ts">
	import Layout from './Layout.svelte';
	import PGPPage from './lib/pgp/PGPPage.svelte';
	import GenerateKey from './lib/pgp/GenerateKey.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, Pages } from './lib/router.svelte.js';
</script>

<Layout>
	{#if router.activeRoute.page === Pages.GUIDE}
		<Guide />
	{:else if router.activeRoute.page === Pages.GENERATE_KEY}
		<GenerateKey />
	{:else}
		<PGPPage />
	{/if}
</Layout>
