<script>
	export let title = '';
	export let successTitle = 'Done!';
	export let action; // Function to execute
	export let tooltipClass = '';
	let className = '';
	export { className as class };

	let currentTitle = title;
	let timeout;

	async function handleClick(event) {
		// Prevent default and stop propagation to prevent page refresh or parent clicks
		event.preventDefault();
		event.stopPropagation();

		if (action) {
			await action();
		}

		currentTitle = successTitle;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			currentTitle = title;
		}, 2000);
	}
</script>

<div class="tooltip tooltip-left {tooltipClass}" data-tip={currentTitle}>
	<button type="button" class="btn {className}" on:click={handleClick} aria-label={title} {title}>
		<slot />
	</button>
</div>
