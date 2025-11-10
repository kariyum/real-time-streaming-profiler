<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';

	let { data } = $props();

	let dashboards = $derived(data.dashboards);
	let linkData = page.url.searchParams.get('data');
</script>

{#if linkData !== null}
	<TableWithMinMax data={linkData}></TableWithMinMax>
{:else}
	<Dashboards {dashboards}></Dashboards>
{/if}
