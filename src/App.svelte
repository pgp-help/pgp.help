<script lang="ts">
	import Layout from './Layout.svelte';
	import PGPWorkflow from './routes/PGPWorkflow.svelte';
	import Guide from './routes/Guide.svelte';
	import { router } from './lib/router.svelte.js';
</script>

<Layout>
	{#if router.activeRoute.page === 'Guide'}
		<Guide />
	{:else}
		<PGPWorkflow />
	{/if}
</Layout>
