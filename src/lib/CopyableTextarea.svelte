<script>
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	import { onMount, onDestroy } from 'svelte';
	import MiniActionButton from './MiniActionButton.svelte';
	import CopyIcon from './icons/CopyIcon.svelte';
	import MarkdownIcon from './icons/MarkdownIcon.svelte';
	import ShareIcon from './icons/ShareIcon.svelte';

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
	{#if showButtons && value}
		<div class="fab fab-down absolute">
			<!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
			<div tabindex="0" role="button" class="btn btn-mini" title="Share"><ShareIcon /></div>

			<!-- buttons that show up when FAB is open -->
			<div>
				<MiniActionButton secondary label="Copy" feedback="Copied!" onclick={copyToClipboard}>
					<CopyIcon />
				</MiniActionButton>
			</div>
			<div>
				<MiniActionButton
					secondary
					label="Copy (Markdown)"
					feedback="Copied!"
					onclick={copyToClipboardMarkdown}
				>
					<MarkdownIcon />
				</MiniActionButton>
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
