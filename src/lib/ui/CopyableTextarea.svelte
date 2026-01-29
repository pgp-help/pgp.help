<script lang="ts">
	// This component renders a textarea with a built-in "Copy to Clipboard" button.
	// It also includes logic to auto-select all text when the textarea is focused,
	// making it easier for users to copy the content manually if needed.

	const BASE_PATH = import.meta.env.BASE_URL || '/';
	import CopyIcon from './icons/CopyIcon.svelte';
	import MarkdownIcon from './icons/MarkdownIcon.svelte';
	import ShareIcon from './icons/ShareIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';

	import { isAGEKeyString } from '../pgp/age';

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
		compact = false
	} = $props<{
		value?: string;
		readonly?: boolean;
		placeholder?: string;
		label?: string;
		id?: string;
		selectAllOnFocus?: boolean;
		fixed?: boolean;
		error?: string;
		rows?: number;
		class?: string;
		compact?: boolean;
	}>();

	let errorId = $derived(error ? `${id || 'textarea'}-error` : undefined);

	let textareaElement = $state<HTMLTextAreaElement>();
	let codeElement = $state<HTMLElement>();

	// Track if user has already interacted with the code element
	let hasInteracted = $state(false);

	let cols = $derived(
		!fixed && value ? Math.max(...value.split('\n').map((l) => l.length)) + 0 : undefined
	);

	let isPublicKey = $derived(
		value &&
			(value.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') ||
				(isAGEKeyString(value) && value.startsWith('age1')))
	);

	let isPrivateKey = $derived(value && value.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----'));

	let isKey = $derived(isPublicKey || isPrivateKey);

	let headerText = $derived(isKey ? 'KEY' : value ? 'MESSAGE' : 'RESULT');

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value || '');
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function copyToClipboardReddit() {
		const redditValue = (value || '')
			.split('\n')
			.map((line) => '    ' + line)
			.join('\n');
		try {
			await navigator.clipboard.writeText(redditValue);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function copyLink() {
		const baseUrl = window.location.origin + BASE_PATH;
		const url = new URL(baseUrl);
		if (value) url.searchParams.set('key', value);
		try {
			await navigator.clipboard.writeText(url.toString());
		} catch (err) {
			console.error('Failed to copy link: ', err);
		}
	}

	$effect(() => {
		// Watch for visibility changes:
		if (fixed || !textareaElement) return;

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
		if (fixed || !textareaElement) return;
		if (value === undefined) return;
		adjustHeight();
	});

	function adjustHeight() {
		if (!textareaElement) return;

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

	function handleCodeClick() {
		if (!selectAllOnFocus || !codeElement) return;

		// Only select all on the first click
		if (hasInteracted) return;

		const selection = window.getSelection();
		if (selection) {
			const range = document.createRange();
			range.selectNodeContents(codeElement);
			selection.removeAllRanges();
			selection.addRange(range);
			hasInteracted = true;
		}
	}

	// Reset interaction state when value changes
	$effect(() => {
		void value;
		hasInteracted = false;
	});
</script>

<div class="relative w-full">
	{#if fixed}
		<div class="card-panel rounded-xl overflow-hidden flex flex-col bg-base-200">
			<!-- Toolbar -->
			<div class="h-10 bg-base-300 border-b border-base-300 flex items-center justify-between px-3">
				{#if !compact}
					<span class="text-xs font-mono text-base-content/60">{headerText}</span>
				{/if}
				{#if value}
					<div class="dropdown dropdown-end">
						<div
							tabindex="0"
							role="button"
							class="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium cursor-pointer"
						>
							<ShareIcon /> Share
						</div>
						<ul tabindex="-1" class="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52">
							<li>
								<a onclick={copyToClipboard}>
									<CopyIcon /> Copy
								</a>
							</li>
							<li>
								<a onclick={copyToClipboardReddit}>
									<MarkdownIcon /> Copy (Markdown)
								</a>
							</li>
							{#if isPublicKey}
								<li>
									<a onclick={copyLink}>
										<LinkIcon /> Copy Link
									</a>
								</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>
			<!-- Code Content -->
			<div class="flex-1 p-4 overflow-auto">
				<code
					bind:this={codeElement}
					class="font-mono text-xs text-base-content/70 block whitespace-pre break-all cursor-text {className}"
					onclick={handleCodeClick}
				>
					{value}
				</code>
			</div>
		</div>
	{:else}
		<div class="card-panel rounded-xl overflow-hidden flex flex-col bg-base-200">
			<!-- Toolbar -->
			<div class="h-10 bg-base-300 border-b border-base-300 flex items-center justify-between px-3">
				{#if !compact}
					<span class="text-xs font-mono text-base-content/60">{headerText}</span>
				{/if}
				{#if value}
					<div class="dropdown dropdown-end">
						<div
							tabindex="0"
							role="button"
							class="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium cursor-pointer"
						>
							<ShareIcon /> Share
						</div>
						<ul tabindex="-1" class="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52">
							<li>
								<a onclick={copyToClipboard}>
									<CopyIcon /> Copy
								</a>
							</li>
							<li>
								<a onclick={copyToClipboardReddit}>
									<MarkdownIcon /> Copy (Markdown)
								</a>
							</li>
							{#if isPublicKey}
								<li>
									<a onclick={copyLink}>
										<LinkIcon /> Copy Link
									</a>
								</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>
			<!-- Textarea Content -->
			<div class="flex-1 p-4 overflow-auto">
				<textarea
					{id}
					bind:this={textareaElement}
					bind:value
					{cols}
					{rows}
					{readonly}
					{placeholder}
					class="textarea textarea-code w-full whitespace-pre-wrap bg-base-100 {className} {error
						? 'border-error'
						: ''}"
					aria-label={label}
					aria-invalid={error ? 'true' : undefined}
					aria-describedby={errorId}
					onfocus={handleFocus}
					onmousedown={handleMouseDown}
					onmouseup={handleMouseUp}
				></textarea>
			</div>
		</div>
	{/if}
	{#if error}
		<div class="label">
			<span id={errorId} class="label-text-alt text-error">{error}</span>
		</div>
	{/if}
</div>

<style>
	.textarea-code {
		font-family: monospace;
	}
</style>
