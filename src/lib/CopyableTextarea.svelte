<script>
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	export let value = '';
	export let readonly = false;
	export let placeholder = '';
	export let label = '';
	export let id = '';
	export let rows = 10;
	export let showButtons = true;
	export let selectAllOnFocus = true;

	let textareaElement;
	let showToast = false;
	let toastMessage = 'Copied!';

	function triggerToast(message = 'Copied!') {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 2000);
	}

	async function copyToClipboard(event) {
		// Prevent default and stop propagation to prevent page refresh
		event.preventDefault();
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(value);
			triggerToast('Copied!');
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function pasteFromClipboard(event) {
		event.preventDefault();
		event.stopPropagation();

		// Focus the textarea first. This is often required for clipboard operations
		// and provides better UX (cursor lands in the box).
		if (textareaElement) {
			textareaElement.focus();
		}

		try {
			// This might trigger a browser permission prompt or "Paste" bubble.
			// This is a browser security feature we cannot bypass.
			const text = await navigator.clipboard.readText();
			value = text;
			triggerToast('Pasted!');
		} catch (err) {
			console.error('Failed to paste text: ', err);
			// Fallback message for browsers that block programmatic paste (e.g. Firefox)
			triggerToast('Use Ctrl+V to paste');
		}
	}

	function handleCopy() {
		triggerToast('Copied!');
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

<div class="relative w-full">
	<textarea
		{id}
		bind:this={textareaElement}
		bind:value
		{readonly}
		{placeholder}
		{rows}
		class="textarea textarea-code w-full"
		aria-label={label}
		on:focus={handleFocus}
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
		on:copy={handleCopy}
	></textarea>

	{#if showButtons}
		<div class="absolute top-2 right-2 z-10 flex">
			{#if !readonly}
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					on:click={pasteFromClipboard}
					aria-label="Paste from clipboard"
					title="Paste from clipboard"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
						></path>
						<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
					</svg>
				</button>
			{/if}
			<button
				type="button"
				class="btn btn-ghost btn-sm"
				on:click={copyToClipboard}
				aria-label="Copy to clipboard"
				title="Copy to clipboard"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
				</svg>
			</button>
		</div>
	{/if}

	{#if showToast}
		<div class="absolute bottom-4 right-4 z-20">
			<div class="alert alert-success shadow-lg py-1 px-3 text-sm">
				<span>{toastMessage}</span>
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
