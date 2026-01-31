<script lang="ts">
	import { parseKey, type CryptoKey } from './keyStore.svelte.js';

	let {
		value = $bindable(''),
		label = 'Import Key',
		placeholder = 'Paste PGP or AGE Key...',
		onKeyParsed
	} = $props<{
		value?: string;
		label?: string;
		placeholder?: string;
		onKeyParsed?: (key: CryptoKey) => void;
	}>();

	let error = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	// Expose the textarea ref for parent components
	export const focus = () => textareaRef?.focus();

	$effect(() => {
		const k = value;
		if (!k) {
			error = '';
			return;
		}

		parseKey(k)
			.then(async (details) => {
				onKeyParsed?.(details);
			})
			.catch((err) => {
				if (value === k) {
					error = err.message;
				}
			});
	});
</script>

<div class="card-field" data-state={error ? 'error' : ''}>
	<div class="card-field-header"><label for="raw-input">Import Key</label></div>
	<div class="card-field-body">
		<textarea
			bind:this={textareaRef}
			bind:value
			aria-label={label}
			aria-errormessage={error ? 'raw-input-error' : undefined}
			aria-invalid={!!error}
			class="textarea textarea-ghost h-32 w-full resize-y border-none focus:outline-none focus:bg-transparent"
			{placeholder}
		></textarea>
	</div>
	{#if error}
		<div class="card-field-footer" id="raw-input-error">{error}</div>
	{/if}
</div>
