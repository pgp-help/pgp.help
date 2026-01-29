<script lang="ts">
	// Allow any HTML SVG attributes (class, width, height, etc.)
	let { ...props } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	stroke-width="2"
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
	{...props}
>
	<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
</svg>
