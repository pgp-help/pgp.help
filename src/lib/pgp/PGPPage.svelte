<script lang="ts">
	import KeySidebar from './KeySidebar.svelte';
	import PGPWorkflow from './PGPWorkflow.svelte';
</script>

<aside aria-label="Sidebar">
	<KeySidebar />
</aside>

<main class="flex-1 overflow-y-auto p-4 sm:p-8" aria-label="PGP Workflow">
	<PGPWorkflow />
</main>
