<script lang="ts">
	import { toSvg } from 'jdenticon';
	import { type CryptoKey } from '../pgp/crypto';

	interface Props {
		/** The fingerprint to generate the avatar from */
		cryptoKey: CryptoKey;
		/** Size of the avatar in pixels */
		size?: number;
		/** Additional CSS classes for the avatar */
		class?: string;
		/** Alt text for the avatar */
		alt?: string;
	}

	let { cryptoKey, size = 64, class: className = '', alt = 'Key avatar' }: Props = $props();

	let sizeClass = $derived(`w-[${size}px] h-[${size}px]`);
	let fingerprint = $derived(cryptoKey.getFingerprint());

	let svgDataUrl = $derived.by(() => {
		if (fingerprint && size) {
			const svgString = toSvg(fingerprint, size);
			// Convert SVG to data URI
			const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(svgBlob);
			return url;
		}
		return '';
	});
</script>

<div class="avatar">
	<div class="rounded-xl overflow-hidden border border-base-300 {className} {sizeClass}">
		{#if svgDataUrl}
			<img src={svgDataUrl} {alt} class={sizeClass} />
		{:else}
			<div class="skeleton w-full h-full {sizeClass}"></div>
		{/if}
	</div>
</div>
