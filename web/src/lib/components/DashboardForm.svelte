<script lang="ts">
	let { title = $bindable(), description = $bindable() }: { title: string; description: string } =
		$props();
</script>

<div class="form-fields">
	<div class="field-group">
		<label for="snapshot-title">Snapshot Title <span class="required">*</span></label>
		<input
			type="text"
			name="title"
			id="snapshot-title"
			placeholder="e.g. Login flow — v1.4.2 profiling"
			bind:value={title}
		/>
	</div>
	<div class="field-group">
		<label for="snapshot-description">Description <span class="optional">(optional)</span></label>
		<textarea
			name="description"
			id="snapshot-description"
			placeholder="Add notes about this snapshot — branch, environment, observations..."
			bind:value={description}
		></textarea>
	</div>
</div>

<style>
	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;

		label {
			font-size: 0.775rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--font-secondary);
		}
	}

	.required {
		color: var(--danger);
		font-weight: 700;
	}

	.optional {
		color: var(--font-muted);
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		font-size: 0.7rem;
	}

	input {
		width: 100%;
		box-sizing: border-box;
		height: 2.6rem;
	}

	textarea {
		width: 100%;
		box-sizing: border-box;
		height: 8rem;
		resize: vertical;
		line-height: 1.6;
		font-size: 0.9rem;
	}
</style>
