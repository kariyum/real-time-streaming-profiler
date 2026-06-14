<script lang="ts">
	import { ArrowLeftRight, Play, RotateCcw, Square, Server } from '@lucide/svelte';
	import { eventStreamState as streamState } from '$lib/eventSource.svelte.ts';
	import { openBenchmarkSelector } from '$lib/components/BenchmarkSelector.svelte';

	let showCompare = $state(false);
</script>

<section class="control-panel">
	<div class="input-wrapper">
		<span class="input-prefix">
			<Server size="16" />
		</span>
		<input
			id="host-ip"
			type="text"
			bind:value={streamState.ip}
			placeholder="localhost:8080"
			disabled={streamState.connected === 'connecting' || streamState.connected === 'open'}
		/>
	</div>

	{#if streamState.connected === 'connecting'}
		<span class="badge badge-warning">
			<span class="pulse-dot dot-warning"></span>
			Connecting...
		</span>
	{:else if streamState.connected === 'open'}
		<span class="badge badge-success">
			<span class="pulse-dot dot-success"></span>
			Online
		</span>
	{:else if streamState.connected === 'closed'}
		<span class="badge badge-neutral">
			<span class="static-dot dot-neutral"></span>
			Offline
		</span>
	{:else if streamState.connected === 'error'}
		<span class="badge badge-danger">
			<span class="pulse-dot dot-danger"></span>
			FF15
		</span>
	{/if}

	{#if streamState.connected !== 'open' && streamState.connected !== 'connecting'}
		<button class="primary" onclick={() => streamState.connect()} aria-label="Connect">
			<Play size="16" />
		</button>
	{:else}
		<button class="danger" onclick={streamState.disconnect} aria-label="Disconnect">
			<Square size="16" />
		</button>
	{/if}
	<button
		onclick={() => {
			streamState.reset();
		}}
		aria-label="Reset metrics"
	>
		<RotateCcw size="16" />
	</button>
	<button onclick={() => openBenchmarkSelector()} aria-label="Compare with snapshot">
		<ArrowLeftRight size="16" />
		Diff
	</button>
</section>

<style>
	.control-panel {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
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
</style>
