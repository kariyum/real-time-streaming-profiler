<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import type { EnhancedMetric, SingleMetric } from '$lib/types.ts';
	import { onDestroy } from 'svelte';
	import { computeChildren, processData } from '../utils.ts';
	import Table from './Table.svelte';
	import { Play, RotateCcw, Square, Server } from '@lucide/svelte';

	type Props = {
		onMessage: (msg: any) => void;
		ip: String;
		onClose?: () => void;
		onOpen?: () => void;
		onReset?: () => void;
	};

	let {
		onMessage,
		ip = $bindable(),
		onReset = () => {},
		onClose = () => {},
		onOpen = () => {}
	}: Props = $props();

	let eventSource: EventSource | undefined;

	let connected = $derived.by(() => {
		if (eventSource) {
			return eventSource.readyState;
		} else {
			return 2;
		}
	});

	onDestroy(() => {
		if (browser && eventSource) {
			eventSource.close();
			onClose();
		}
	});

	// metrics = [
	// 	{ id: 'test01', parent: null, start_end_times: [1 * 1000000, 6 * 1000000] },
	// 	{ id: 'test03', parent: null, start_end_times: [1 * 1000000, 6 * 1000000] },
	// 	{ id: 'test01', parent: null, start_end_times: [1 * 1000000, 7 * 1000000] },
	// 	{ id: 'test02', parent: 'test01', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test022', parent: 'test01', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test02', parent: 'test01', start_end_times: [4 * 1000000, 6 * 1000000] },
	// 	{ id: 'test05', parent: 'test02', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test06', parent: 'test05', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test07', parent: 'test02', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test08', parent: 'test06', start_end_times: [3 * 1000000, 5 * 1000000] },
	// 	{ id: 'test10', parent: 'test08', start_end_times: [3 * 1000000, 5 * 1000000] }
	// ];

	// setInterval(() => {
	// 	metrics.push({
	// 		id: 'test0' + Math.floor(Math.random() * 10).toString(),
	// 		parent: null,
	// 		start_end_times: [Math.random() * 10 * 1000000, Math.random() * 10 * 1000000]
	// 	});
	// 	enhancedMetrics = computeChildren(processData(metrics));
	// }, 500);

	// enhancedMetrics = computeChildren(processData(metrics));
	function connect() {
		if (eventSource) {
			eventSource.close();
			onClose();
			console.log('Closing last connection.');
		}

		// Ensure we format the URL correctly based on the ip state variable
		let url = ip.trim();
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'http://' + url;
		}
		if (!url.includes(':') && !url.slice(8).includes('/')) {
			url = url + ':8080';
		}
		if (!url.endsWith('/subscribe')) {
			url = url.replace(/\/$/, '') + '/subscribe';
		}

		console.log('Connecting to SSE at:', url);
		eventSource = new EventSource(url);

		eventSource.onerror = (event: Event) => {
			connected = 3;
			console.log('SSE connection error:', event);
		};
		eventSource.onopen = (event: Event) => {
			connected = 1;
			console.log('SSE connection opened:', event);
		};
		eventSource.onmessage = (event) => {
			if (eventSource) {
				connected = eventSource.readyState;
				if (event.data) {
					const data = JSON.parse(event.data);
					onMessage(data);
				}
			}
		};
	}

	function disconnect() {
		if (connected === 1 && eventSource) {
			eventSource.close();
			connected = eventSource.readyState;
			eventSource = undefined;
		}
	}
</script>

<section class="control-panel">
	<div class="input-wrapper">
		<span class="input-prefix">
			<Server size="16" />
		</span>
		<input
			id="host-ip"
			type="text"
			bind:value={ip}
			placeholder="localhost:8080"
			disabled={connected === 1 || connected === 0}
		/>
	</div>

	{#if connected === 0}
		<span class="badge badge-warning">
			<span class="pulse-dot dot-warning"></span>
			Connecting...
		</span>
	{:else if connected === 1}
		<span class="badge badge-success">
			<span class="pulse-dot dot-success"></span>
			Connected & Live
		</span>
	{:else if connected === 2}
		<span class="badge badge-neutral">
			<span class="static-dot dot-neutral"></span>
			Closed
		</span>
	{:else if connected === 3}
		<span class="badge badge-danger">
			<span class="pulse-dot dot-danger"></span>
			Connection Error
		</span>
	{/if}

	{#if connected !== 1 && connected !== 0}
		<button class="primary" onclick={() => connect()} aria-label="Connect">
			<Play size="16" />
		</button>
	{:else}
		<button class="danger" onclick={disconnect} aria-label="Disconnect">
			<Square />
		</button>
	{/if}

	<button onclick={onReset} aria-label="Reset metrics">
		<RotateCcw size="16" />
	</button>
</section>

<style>
	.control-panel {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.main-container {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		margin-top: 1rem;
	}

	.page-header {
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: 1.875rem;
		margin-bottom: 0.25rem;
		background: linear-gradient(to right, var(--font-color), var(--font-secondary));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--font-secondary);
		margin: 0;
	}

	/* Panel card styles */
	.panel-card {
		background-color: var(--panel-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--panel-shadow);
		padding: 1.5rem;
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal),
			box-shadow var(--transition-normal);
	}

	/* Control Grid layout */
	.control-grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr;
		align-items: flex-end;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		gap: 0.5rem;

		label {
			font-size: 0.775rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--font-secondary);
		}
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;

		input {
			width: 100%;
			padding-left: 2.5rem;
			box-sizing: border-box;
			height: 2.6rem;
		}
	}

	.input-prefix {
		position: absolute;
		left: 0.85rem;
		display: flex;
		align-items: center;
		color: var(--font-muted);
		pointer-events: none;
	}

	.status-section {
		display: flex;
		gap: 0.5rem;
	}

	.status-label {
		font-size: 0.775rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--font-secondary);
	}

	.status-badge-container {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
	}

	.badge-success {
		background-color: var(--success-soft);
		color: var(--success);
	}

	.badge-warning {
		background-color: var(--warning-soft);
		color: var(--warning);
	}

	.badge-danger {
		background-color: var(--danger-soft);
		color: var(--danger);
	}

	.badge-neutral {
		background-color: var(--table-header);
		color: var(--font-secondary);
		border: 1px solid var(--panel-border);
	}

	/* Pulse DOTS */
	.pulse-dot,
	.static-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.dot-success {
		background-color: var(--success);
	}
	.dot-warning {
		background-color: var(--warning);
	}
	.dot-danger {
		background-color: var(--danger);
	}
	.dot-neutral {
		background-color: var(--font-muted);
	}

	.pulse-dot {
		box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.7);
		animation: pulse 1.6s infinite cubic-bezier(0.66, 0, 0, 1);
	}

	@keyframes pulse {
		to {
			box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
		}
	}

	.actions-wrapper {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		height: 2.6rem;

		button {
			height: 100%;
		}
	}

	.table-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.data-summary {
		font-size: 0.775rem;
		color: var(--font-muted);
		display: block;
		margin-top: 0.25rem;
	}

	/* Empty state layout */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--font-secondary);

		h3 {
			font-size: 1.25rem;
			margin: 1rem 0 0.5rem 0;
		}

		p {
			max-width: 400px;
			margin: 0;
			font-size: 0.875rem;
			color: var(--font-muted);
		}
	}

	@media (max-width: 900px) {
		.control-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
			align-items: stretch;
		}

		.actions-wrapper {
			margin-top: 0.5rem;
		}
	}
</style>
