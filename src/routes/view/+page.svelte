<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	import type { DashboardEntityFirestore } from '$lib/firebase';
	let localId: string | null = $state(null);

	$effect.pre(() => {
		localId = page.url.searchParams.get('local_id');
	});
</script>

{#if typeof localId == 'string'}
	<TableWithMinMax data={localId}></TableWithMinMax>
{:else}
	<Dashboards></Dashboards>
{/if}
