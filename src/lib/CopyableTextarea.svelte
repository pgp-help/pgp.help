<script>
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	import FeedbackButton from './FeedbackButton.svelte';
	import { onMount, onDestroy } from 'svelte';

	export let value = '';
	export let readonly = false;
	export let placeholder = '';
	export let label = '';
	export let id = '';
	export let showButtons = true;
	export let selectAllOnFocus = true;
	export let fixed = false;
	export let error = '';
	let className = '';
	export { className as class };

	let textareaElement;
	let resizeObserver;

	$: cols = fixed && value ? Math.max(...value.split('\n').map((l) => l.length)) + 0 : undefined;

	onMount(() => {
		if (fixed && textareaElement) {
			// Need to find the right hook to calculate the size after Svelte has rendered the value
			// Feel this is overkill, but at least it works.
			// I'm told that `field-sizing: content` would be ideal here, but it's not widely supported yet.
			resizeObserver = new ResizeObserver(() => {
				adjustHeight();
			});
			resizeObserver.observe(textareaElement);
		}
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});

	function adjustHeight() {
		if (!textareaElement) return;
		textareaElement.style.height = 'auto';
		textareaElement.style.height = textareaElement.scrollHeight + 'px';
		//console.log('Height adjustment: scrollHeight =', textareaElement.style.height, 'px');
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function copyToClipboardMarkdown() {
		const markdownValue = '```\n' + value + '\n```';
		try {
			await navigator.clipboard.writeText(markdownValue);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
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

	function handleMouseUp(event) {
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

<div class="relative {fixed ? 'w-fit' : 'w-full'}">
	<textarea
		{id}
		bind:this={textareaElement}
		bind:value
		{cols}
		readonly={readonly || fixed}
		{placeholder}
		class="textarea textarea-code w-full {fixed ? 'resize-none' : ''} {className} {error
			? 'textarea-error'
			: ''}"
		style={fixed ? 'height: auto; overflow-y: hidden;' : ''}
		aria-label={label}
		on:focus={handleFocus}
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
	></textarea>
	{#if error}
		<div class="label">
			<span class="label-text-alt text-error">{error}</span>
		</div>
	{/if}
	{#if showButtons}
		<div class="absolute top-2 right-2 z-10 flex flex-col gap-2 group">
			<!-- Main Copy Button -->
			<FeedbackButton
				title="Copy"
				successTitle="Copied!"
				action={copyToClipboard}
				class="btn-ghost btn-sm"
				tooltipClass="group-hover:tooltip-open"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.875.63-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
					/>
				</svg>
			</FeedbackButton>

			<!-- Markdown Copy Button (Hidden by default, shown on group hover) -->
			<div class="hidden group-hover:block animate-fade-in">
				<FeedbackButton
					title="Copy (Markdown)"
					successTitle="Copied!"
					action={copyToClipboardMarkdown}
					class="btn-ghost btn-sm"
					tooltipClass="group-hover:tooltip-open"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M7 8v8 M17 8v8 M7 8l5 5 5-5"
						/>
					</svg>
				</FeedbackButton>
			</div>
		</div>
	{/if}
</div>

<style>
	.textarea-code {
		font-family: monospace;
		height: 256px;
	}
</style>
