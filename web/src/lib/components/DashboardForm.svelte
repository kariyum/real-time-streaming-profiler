<script lang="ts">
	let { title = $bindable(), description = $bindable() }: { title: string; description: string } =
		$props();
</script>

<div class="main">
	<input
		class="noborder"
		type="text"
		name="title"
		id="title"
		placeholder="Title"
		bind:value={title}
	/>
	<textarea
		class="noborder"
		name="description"
		id="description"
		placeholder="Description"
		bind:value={description}
	></textarea>
</div>

<style>
	.main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: stretch;
		margin-bottom: 1rem;
	}

	input,
	textarea {
		padding: 0.3rem;
	}

	.noborder:focus {
		outline: none;
	}

	textarea {
		height: 13rem;
	}
</style>
