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
	<circle cx="18" cy="5" r="3" fill="currentColor" />
	<circle cx="6" cy="12" r="3" fill="currentColor" />
	<circle cx="18" cy="19" r="3" fill="currentColor" />
	<line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
	<line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
</svg>
