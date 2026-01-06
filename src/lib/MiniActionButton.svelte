<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label = '',
		onclick,
		children,
		feedback = 'Done!',
		secondary = false,
		class: className = '',
		tooltipDir = 'tooltip-left'
	} = $props<{
		label?: string;
		onclick?: (e: MouseEvent) => void | Promise<void>;
		children?: Snippet;
		feedback?: string;
		secondary?: boolean;
		class?: string;
		tooltipDir?: string;
	}>();

	let currentTitle = $state(label);
	let timeout: ReturnType<typeof setTimeout>;

	async function handleClick(event: MouseEvent) {
		// Prevent default and stop propagation to prevent page refresh or parent clicks
		event.preventDefault();
		event.stopPropagation();

		if (onclick) {
			await onclick(event);
		}

		// Show feedback
		const originalTitle = label;
		currentTitle = feedback;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			currentTitle = originalTitle;
		}, 2000);
	}

	// If label changes externally, update currentTitle unless we are showing feedback
	$effect(() => {
		if (currentTitle !== feedback) {
			currentTitle = label;
		}
	});
</script>

<div
	class="tooltip {tooltipDir} {secondary ? 'hidden group-hover:block animate-fade-in' : ''}"
	data-tip={currentTitle}
>
	<button
		type="button"
		class="btn-mini {className}"
		onclick={handleClick}
		aria-label={label}
		title={label}
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
</div>
