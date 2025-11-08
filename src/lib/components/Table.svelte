<script lang="ts">
	import type { EnhancedMetric } from '$lib/types';
	import Row from './Row.svelte';
	let {
		data,
		max,
		min,
		initShow
	}: { data: EnhancedMetric[]; max: number; min: number; initShow: boolean } = $props();
</script>

<table>
	<thead>
		<tr>
			<th>Function Name</th>
			<th>Nb Calls</th>
			<th>Average</th>
			<th>Min</th>
			<th>Max</th>
			<th>CPU time</th>
		</tr>
	</thead>
	<tbody>
		{#if data}
			{#each data as item (item.id)}
				{#if !item.parent}
					<Row currentItem={item} data={item.children} depth={0} {max} {min} {initShow} />
				{/if}
			{/each}
		{/if}
	</tbody>
</table>

<style>
	table {
		font-family: arial, sans-serif;
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	/* table {
        white-space: nowrap;
    } */

	thead {
		position: sticky;
		background: var(--table-header);
		top: 0;
		padding: 0;
		margin: 0;
	}

	th {
		position: sticky;
		top: 0px;
		border: 1px solid var(--table-border);
		text-align: left;
		padding: 8px;
	}
</style>
