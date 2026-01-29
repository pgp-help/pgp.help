<script lang="ts">
	// Allow any HTML SVG attributes (class, width, height, etc.)
	let { ...props } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	viewBox="0 0 24 24"
	stroke-width="1.5"
	stroke="currentColor"
	{...props}
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
	></path>
</svg>
