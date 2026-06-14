<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	let localId: string | null = $derived(page.url.searchParams.get('local_id'));
</script>

{#if localId}
	<TableWithMinMax data={localId}></TableWithMinMax>
{:else}
	<Dashboards></Dashboards>
{/if}
