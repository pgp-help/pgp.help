<script lang="ts">
	import Layout from './Layout.svelte';
	import Home from './routes/Home.svelte';
	import Guide from './routes/Guide.svelte';
	import { router } from './lib/router.svelte.js';
</script>

<Layout>
	{#if router.path === '/Guide'}
		<Guide />
	{:else}
		<Home />
	{/if}
</Layout>
