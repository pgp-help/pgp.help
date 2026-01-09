<script lang="ts">
	import MiniActionButton from '../ui/MiniActionButton.svelte';
	import CopyIcon from '../ui/icons/CopyIcon.svelte';
	import MarkdownIcon from '../ui/icons/MarkdownIcon.svelte';
	import LinkIcon from '../ui/icons/LinkIcon.svelte';
	import ShareIcon from '../ui/icons/ShareIcon.svelte';

	let { value = '' } = $props();

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

	async function shareAsLink() {
		const url = `${window.location.origin}/?key=${encodeURIComponent(value)}`;
		try {
			await navigator.clipboard.writeText(url);
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
	<div>
		<MiniActionButton secondary label="Share as Link" feedback="Copied Link!" onclick={shareAsLink}>
			<LinkIcon />
		</MiniActionButton>
	</div>
</div>
