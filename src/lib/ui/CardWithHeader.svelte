<script lang="ts">
	let {
		title,
		children,
		actions,
		readonly = false,
		error = $bindable(null), // Bindable: parent can set it or clear it
		...rest
	} = $props();

	// 1. Generate IDs for the Field (Label) and the Error Message
	const fieldId = 'field-' + Math.random().toString(36).substring(2, 9);
	const errorId = 'error-' + fieldId;

	// 2. Helper to check if error is active
	let hasError = $derived(!!error);
</script>

<div
	role="group"
	{...rest}
	class="
		card overflow-hidden border bg-base-100 rounded-box transition-colors duration-200
		
		/* CONDITIONAL BORDER LOGIC */
		/* If Error: Red Border + Red Ring on Focus */
		/* If Normal: Gray Border + Blue Ring on Focus */
		{hasError
		? 'border-error focus-within:border-error focus-within:ring-1 focus-within:ring-error'
		: 'border-base-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'}

		{rest.class}
	"
>
	<!-- HEADER -->
	<div
		class="flex items-center justify-between border-b px-4 py-2 bg-base-200
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
