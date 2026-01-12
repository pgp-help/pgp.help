<script lang="ts">
	import MiniActionButton from './MiniActionButton.svelte';
	import CopyIcon from './icons/CopyIcon.svelte';
	import MarkdownIcon from './icons/MarkdownIcon.svelte';
	import ShareIcon from './icons/ShareIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';

	let { value = '' } = $props();

	let isPublicKey = $derived(value.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----'));

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

	async function copyLink() {
		const url = new URL(window.location.href);
		url.searchParams.set('key', value);
		try {
			await navigator.clipboard.writeText(url.toString());
		} catch (err) {
			console.error('Failed to copy link: ', err);
		}
	}
</script>

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
	{#if isPublicKey}
		<div>
			<MiniActionButton secondary label="Copy Link" feedback="Copied!" onclick={copyLink}>
				<LinkIcon />
			</MiniActionButton>
		</div>
	{/if}
</div>
