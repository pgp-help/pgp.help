<script lang="ts">
	import { onMount } from 'svelte';
	let {
		title,
		children,
		actions = null,
		readonly = false,
		error = $bindable(null), // Bindable: parent can set it or clear it
		...rest
	} = $props();

	let fieldId = $state('field-init');

	onMount(() => {
		// Only generate a randomID (once; client-side) for link to label
		fieldId = 'field-' + crypto.randomUUID().slice(0, 8);
	});

	const errorId = $derived('error-' + fieldId);

	// 2. Helper to check if error is active
	let hasError = $derived(!!error);
</script>

<div role="group" {...rest} class="card-field overflow-hidden" data-invalid={hasError}>
	<!-- HEADER -->
	<div
		class="flex items-center justify-between border-b px-4 h-8 bg-base-200
		{hasError ? 'border-error/20' : 'border-base-300'}"
	>
		<div class="flex-1 min-w-0">
			<label
				for={fieldId}
				class="text-xs font-bold uppercase tracking-wider select-none cursor-pointer block truncate
				text-base-content/60"
			>
				{title}
			</label>
		</div>

		{#if actions}
			<div class="flex items-center gap-2 pl-4">
				{@render actions()}
			</div>
		{/if}
	</div>

	<!-- BODY -->
	<div class:bg-base-200={readonly}>
		<!-- 
             Pass 3 things to the child: 
             1. fieldId (for <textarea id>)
             2. hasError (for <textarea aria-invalid>)
             3. errorId (for <textarea aria-errormessage>)
        -->
		{@render children({ uid: fieldId, isInvalid: hasError, errId: errorId })}
	</div>

	<!-- ERROR FOOTER (Optional, but best practice) -->
	{#if hasError}
		<div
			id={errorId}
			class="bg-error/10 px-4 py-1.5 text-xs font-medium text-error border-t border-error/20 flex items-center gap-1"
			role="alert"
		>
			{error}
		</div>
	{/if}
</div>
