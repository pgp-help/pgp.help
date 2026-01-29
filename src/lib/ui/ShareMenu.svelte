<script lang="ts">
	import CopyIcon from './icons/CopyIcon.svelte';
	import MarkdownIcon from './icons/MarkdownIcon.svelte';
	import ShareIcon from './icons/ShareIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';

	import { isAGEKeyString } from '../pgp/age';

	let { value = '' }: { value: string } = $props();

	let isPublicKey = $derived(
		value &&
			(value.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') ||
				(isAGEKeyString(value) && value.startsWith('age1')))
	);

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
		const baseUrl = window.location.origin + (import.meta.env.BASE_URL || '/');
		const url = new URL(baseUrl);
		if (value) url.searchParams.set('key', value);
		try {
			await navigator.clipboard.writeText(url.toString());
		} catch (err) {
			console.error('Failed to copy link: ', err);
		}
	}
</script>

{#if value}
	<div class="dropdown dropdown-end">
		<div tabindex="0" role="button" class="btn btn-ghost btn-xs text-primary">
			<ShareIcon class="w-4 h-4" />
			<span>{isPublicKey ? 'Share public key' : 'Share message'}</span>
		</div>
		<ul
			tabindex="-1"
			class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 border border-base-300 p-2 shadow-sm"
		>
			<li>
				<button onclick={copyToClipboard}>
					<CopyIcon class="w-4 h-4" />
					<span>Copy</span>
				</button>
			</li>
			<li>
				<button onclick={copyToClipboardReddit}>
					<MarkdownIcon class="w-4 h-4" />
					<span>Copy (Markdown)</span>
				</button>
			</li>
			{#if isPublicKey}
				<li>
					<button onclick={copyLink}>
						<LinkIcon class="w-4 h-4" />
						<span>Copy Link</span>
					</button>
				</li>
			{/if}
		</ul>
	</div>
{/if}
