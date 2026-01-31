<script lang="ts">
	import CopyIcon from './icons/CopyIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';

	interface Props {
		value: string;
		showLink?: boolean;
	}

	let { value, showLink = false }: Props = $props();

	// State for the visual "Copied!" feedback
	let copied = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	function triggerVisualFeedback() {
		copied = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => (copied = false), 2000);

		// Close dropdown manually (DaisyUI reqs focus loss)
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value || '');
			triggerVisualFeedback();
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function copyToClipboardMarkdown() {
		const markdownValue = (value || '')
			.split('\n')
			.map((line) => '    ' + line)
			.join('\n');
		try {
			await navigator.clipboard.writeText(markdownValue);
			triggerVisualFeedback();
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	async function copyLink() {
		const baseUrl = window.location.origin + (import.meta.env.BASE_URL || '/');
		const url = new URL(baseUrl);
		if (value) url.searchParams.set('key', value);
		try {
			await navigator.clipboard.writeText(url.toString());
			triggerVisualFeedback();
		} catch (err) {
			console.error('Failed to copy link: ', err);
		}
	}
</script>

{#if value}
	<div class="join shadow-sm flex items-stretch">
		<!-- Main Copy Button -->
		<button
			type="button"
			class="btn btn-xs btn-primary join-item text-white font-bold"
			onclick={copyToClipboard}
		>
			{#if copied}
				Copied!
			{:else}
				<CopyIcon class="size-3" /> Copy
			{/if}
		</button>

		<!-- Dropdown Wrapper -->
		<!-- 'join-item' on the wrapper creates the straight edge on the left -->
		<div class="dropdown dropdown-end text-xs">
			<!-- Dropdown Trigger -->
			<!-- CRITICAL FIX: Changed from <div> to <button> to fix alignment mismatch -->
			<button
				type="button"
				class="btn btn-xs btn-primary join-item text-white border-l-white/20 pl-1"
				aria-label="Options"
			>
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
				>
			</button>

			<ul
				tabindex="-1"
				class="dropdown-content menu text-xs z-[1] w-40 shadow bg-base-100 rounded-box"
			>
				<li>
					<button type="button" onclick={copyToClipboardMarkdown}> Copy as Markdown </button>
				</li>
				{#if showLink}
					<li>
						<button type="button" onclick={copyLink}>
							<LinkIcon class="size-3" /> Copy as Link
						</button>
					</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}
