<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = 'absolute top-2 right-2 z-10 flex flex-col gap-2' } = $props<{
		children: Snippet;
		class?: string;
	}>();
</script>

<div class="{className} group">
	{@render children()}
</div>
