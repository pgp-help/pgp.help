<script lang="ts">
	import Layout from './Layout.svelte';
	import PGPPage from './routes/PGPPage.svelte';
	import Guide from './routes/Guide.svelte';
	import { router, Pages } from './routes/router.svelte.js';
</script>

<Layout>
	{#if router.activeRoute.page === Pages.GUIDE}
		<Guide />
	{:else}
		<PGPPage />
	{/if}
</Layout>
