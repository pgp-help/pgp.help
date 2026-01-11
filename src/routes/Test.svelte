<script>
	let dialog;

	function openModal() {
		dialog.showModal();
	}
</script>

<main class="container mx-auto max-w-4xl">
	<button class="btn" onclick={openModal}>open modal</button>

	<dialog bind:this={dialog} id="my_modal_1" class="modal">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Hello!</h3>
			<p class="py-4">Press ESC key or click the button below to close</p>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn">Close</button>
				</form>
			</div>
		</div>
	</dialog>
</main>
