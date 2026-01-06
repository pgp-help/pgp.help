<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();
</script>

<div class="absolute top-2 right-2 z-10 flex flex-col gap-2 group">
	{@render children()}
</div>
