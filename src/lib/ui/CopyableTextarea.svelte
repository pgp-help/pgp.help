<script lang="ts">
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		readonly = false,
		placeholder = '',
		label = '',
		id = '',
		selectAllOnFocus = true,
		fixed = false,
		error = '',
		rows = 8,
		class: className = '',
		buttons
	} = $props<{
		value?: string;
		readonly?: boolean;
		placeholder?: string;
		label?: string;
		id?: string;
		selectAllOnFocus?: boolean;
		fixed?: boolean;
		error?: string;
		class?: string;
		rows?: number;
		buttons?: Snippet;
	}>();

	let errorId = $derived(error ? `${id || 'textarea'}-error` : undefined);

	let textareaElement = $state<HTMLTextAreaElement>();

	let cols = $derived(
		fixed && value ? Math.max(...value.split('\n').map((l) => l.length)) + 0 : undefined
	);

	$effect(() => {
		// Watch for visibility changes:
		if (!fixed || !textareaElement) return;

		const observer = new ResizeObserver(() => {
			// Fires when:
			// - Value changes (content grows)
			// - Collapse opens (element becomes visible)
			// - Window resizes
			adjustHeight();
		});

		observer.observe(textareaElement);
		return () => observer.disconnect();
	});

	$effect(() => {
		// Adjust height when value changes:
		if (!fixed || !textareaElement) return;
		if (value === undefined) return;
		adjustHeight();
	});

	function adjustHeight() {
		if (!textareaElement) return; //defensive

		// Skip if element or any ancestor has display: none
		if (textareaElement.offsetParent === null) return;

		textareaElement.style.height = 'auto';
		textareaElement.style.height = textareaElement.scrollHeight + 'px';
	}

	function handleFocus() {
		if (!selectAllOnFocus) return;

		// Select all text when the textarea gains focus - a QoL improvement
		if (textareaElement) {
			textareaElement.select();
			// Use setTimeout to override browser's default scroll-to-selection behavior
			// 10ms delay is usually enough to beat the browser's native scroll-to-cursor
			setTimeout(() => {
				if (textareaElement) {
					textareaElement.setSelectionRange(0, textareaElement.value.length, 'backward');
					textareaElement.scrollTop = 0;
				}
			}, 10);
		}
	}

	function handleMouseDown() {
		if (!selectAllOnFocus) return;

		// If the textarea is not currently focused, we want the subsequent 'mouseup'
		// to NOT clear the selection we are about to make in 'handleFocus'.
		// We mark this state to handle it in 'handleMouseUp'.
		if (textareaElement && document.activeElement !== textareaElement) {
			textareaElement.dataset.preventMouseUp = 'true';
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (!selectAllOnFocus) return;

		// If we flagged this interaction in 'handleMouseDown', prevent the default
		// behavior (which would be to place the cursor and deselect the text).
		// This ensures the 'select()' from 'handleFocus' persists on the first click.
		if (textareaElement && textareaElement.dataset.preventMouseUp === 'true') {
			event.preventDefault();
			delete textareaElement.dataset.preventMouseUp;
		}
	}
</script>

<div class="relative w-full">
	<textarea
		{id}
		bind:this={textareaElement}
		bind:value
		{cols}
		{rows}
		readonly={readonly || fixed}
		{placeholder}
		class="textarea textarea-code w-full whitespace-nowrap {fixed
			? 'resize-none'
			: ''} {className} {error ? 'textarea-error' : ''}"
		style={fixed ? 'height: auto; overflow-y: hidden;' : ''}
		aria-label={label}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={errorId}
		onfocus={handleFocus}
		onmousedown={handleMouseDown}
		onmouseup={handleMouseUp}
	></textarea>
	{#if error}
		<div class="label">
			<span id={errorId} class="label-text-alt text-error">{error}</span>
		</div>
	{/if}
	{#if buttons && value}
		{@render buttons()}
	{/if}
</div>

<style>
	.textarea-code {
		font-family: monospace;
	}
</style>
