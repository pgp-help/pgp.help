<script lang="ts">
	let {
		value = '', // The main text content
		placeholder = '', // Shown if value is empty/null
		class: className = '',
		...rest
	} = $props();

	let element: HTMLDivElement;
	let preventMouseUp = false;

	function handleFocus() {
		if (!element) return;

		// Create the selection range
		const selection = window.getSelection();
		const range = document.createRange();

		// Select everything inside the div
		range.selectNodeContents(element);

		if (selection) {
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

	function handleMouseDown() {
		// If we are not currently focused, we are about to be.
		// Flag this to stop browser from clearing the selection immediately.
		if (document.activeElement !== element) {
			preventMouseUp = true;
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (preventMouseUp) {
			event.preventDefault(); // Stop text deselect
			preventMouseUp = false;
		}
	}
</script>

<!-- 
	Opinionated Defaults:
	- whitespace-pre: Preserves newlines/spaces (like a textarea)
	- font-mono/text-xs: Code-like appearance
	- outline-none: Relies on parent for focus ring
	- cursor-text: Tells user it is selectable
-->
<div
	bind:this={element}
	role="textbox"
	tabindex="0"
	aria-readonly="true"
	class="
		p-4
		font-mono text-xs whitespace-pre text-base-content/60
		cursor-text outline-none
		overflow-auto
		{className}
	"
	onfocus={handleFocus}
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	{...rest}
>
	{#if value}
		{value}
	{:else}
		<!-- pointer-events-none ensures clicking the placeholder focuses the parent div -->
		<span class="text-base-content/40 select-none pointer-events-none italic">
			{placeholder}
		</span>
	{/if}
</div>
