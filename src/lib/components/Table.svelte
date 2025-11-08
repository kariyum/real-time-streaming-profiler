<script lang="ts">
	import type { EnhancedMetric } from '$lib/types';
	import Row from './Row.svelte';
	let { data, max, min }: { data: EnhancedMetric[]; max: number; min: number } = $props();
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
					<Row currentItem={item} data={item.children} depth={0} {max} {min} />
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
		background: white;
		top: 0;
		padding: 0;
		margin: 0;
	}

	th {
		position: sticky;
		top: 0px;
		border: 1px solid #e3e3e3;
		text-align: left;
		padding: 8px;
	}
</style>
