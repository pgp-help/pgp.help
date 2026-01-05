<script>
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	export let value = '';
	export let readonly = false;
	export let placeholder = '';
	export let label = '';
	export let id = '';
	export let showButtons = true;
	export let selectAllOnFocus = true;
	export let fixed = false;
	let className = '';
	export { className as class };

	let textareaElement;
	let copyTooltip = 'Copy';

	$: if (fixed && textareaElement && value !== undefined) {
		// Use setTimeout to ensure the DOM has updated with the new value
		setTimeout(adjustHeight, 0);
	}

	function adjustHeight() {
		if (!textareaElement) return;
		textareaElement.style.height = 'auto';
		textareaElement.style.height = textareaElement.scrollHeight + 'px';
	}

	async function copyToClipboard(event) {
		// Prevent default and stop propagation to prevent page refresh
		event.preventDefault();
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(value);
			copyTooltip = 'Copied!';
			setTimeout(() => {
				copyTooltip = 'Copy';
			}, 2000);
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

<div class="relative {fixed ? 'max-w-prose' : 'w-full'}">
	<textarea
		{id}
		bind:this={textareaElement}
		bind:value
		readonly={readonly || fixed}
		{placeholder}
		class="textarea textarea-code w-full {fixed ? 'resize-none' : ''} {className}"
		style={fixed ? 'height: auto; overflow-y: hidden;' : ''}
		aria-label={label}
		on:focus={handleFocus}
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
	></textarea>
	{#if showButtons}
		<div class="absolute top-2 right-2 z-10 flex">
			<div class="tooltip tooltip-left" data-tip={copyTooltip}>
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					on:click={copyToClipboard}
					aria-label="Copy to clipboard"
					title="Copy to clipboard"
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
				</button>
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
