<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import AsyncButton from './AsyncButton.svelte';
	import CopyButton from './CopyButton.svelte';
	import BenchmarkSelector from './BenchmarkSelector.svelte';
	import { ArrowLeftRight, Clock, Cloud, CloudUpload, Eye, Trash } from '@lucide/svelte';
	import { openBenchmarkSelector } from '$lib/components/BenchmarkSelector.svelte';

	let {
		dashboard,
		deleteDashboard,
		uploadDashboard
	}: {
		dashboard: DashboardEntityFirestore;
		deleteDashboard: (id: number) => Promise<void>;
		uploadDashboard: (dashboard: DashboardEntityFirestore) => Promise<void>;
	} = $props();

	function formatDate(createdAt: Date): string {
		const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
		const day = createdAt.getDate().toString().padStart(2, '0');
		const hours = createdAt.getHours().toString().padStart(2, '0');
		const minutes = createdAt.getMinutes().toString().padStart(2, '0');
		return `${day}/${month}/${createdAt.getFullYear()} at ${hours}:${minutes}`;
	}
</script>

<div class="dashboard-card">
	<div class="card-header">
		<div class="header-left">
			<h2 class="card-title" title={dashboard.entity.title}>{dashboard.entity.title}</h2>
			<div class="card-date">{formatDate(new Date(dashboard.entity.date.toString()))}</div>
		</div>
		<button
			class="btn-delete-card"
			onclick={async () => {
				if (confirm('Are you sure you want to delete this dashboard?')) {
					if (dashboard.id) {
						await deleteDashboard(dashboard.id);
					}
					if (dashboard.firebaseId) {
						await dashboardsRepoFirebase.delete(dashboard.firebaseId);
					}
				}
			}}
			aria-label="Delete dashboard"
		>
			<Trash size="14" />
		</button>
	</div>

	<div class="card-body">
		{#if dashboard.entity.description && dashboard.entity.description.trim()}
			<pre class="card-desc">{dashboard.entity.description}</pre>
		{:else}
			<p class="card-desc-empty">No snapshot description provided.</p>
		{/if}
	</div>

	<div class="card-footer">
		<div class="footer-actions">
			<a href={resolve('/view') + `?local_id=${dashboard.id}`} class="btn-view-local">
				<Eye size="14" />
				View
			</a>

			<div class="cloud-actions">
				{#if dashboard.firebaseId}
					<div class="actions">
						<!-- <button
							class="btn-compare"
							onclick={() => openBenchmarkSelector()}
							aria-label="Compare with another benchmark"
						>
							<ArrowLeftRight size="14" />
						</button> -->
						<a
							href={resolve('/share') + `?id=${dashboard.firebaseId}`}
							class="btn-cloud-view"
							aria-label="View from cloud"
						>
							<Cloud size="14" />
						</a>
						<CopyButton
							beforeCopyText={'Share'}
							text={page.url.origin + resolve('/share') + `?id=${dashboard.firebaseId}`}
						></CopyButton>
					</div>
				{:else}
					{#snippet idleView()}
						<span class="upload-btn-content">
							<CloudUpload size="14" />
							Upload to Cloud
						</span>
					{/snippet}
					{#snippet endView()}
						Uploaded!
					{/snippet}
					<AsyncButton onclick={async () => uploadDashboard(dashboard)} {idleView} {endView}
					></AsyncButton>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.dashboard-card {
		background-color: var(--panel-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-md);
		box-shadow: var(--panel-shadow);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		min-height: 200px;
		transition:
			transform var(--transition-fast),
			border-color var(--transition-fast),
			box-shadow var(--transition-fast);

		&:hover {
			border-color: rgba(var(--primary-rgb), 0.3);
			box-shadow:
				0 10px 15px -3px rgba(0, 0, 0, 0.05),
				0 4px 6px -4px rgba(0, 0, 0, 0.05),
				0 0 0 1px rgba(var(--primary-rgb), 0.1);
		}
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow: hidden;
		flex: 1;
	}

	.card-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--font-color);
	}

	.card-date {
		font-size: 0.725rem;
		color: var(--font-muted);
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	/* Delete trash icon style */
	.btn-delete-card {
		background-color: transparent;
		border: 1px solid transparent;
		color: var(--font-muted);
		padding: 0.4rem;
		border-radius: var(--radius-sm);
		transition:
			color var(--transition-fast),
			background-color var(--transition-fast);

		&:hover {
			color: var(--danger);
			background-color: var(--danger-soft);
			border-color: transparent;
		}
	}

	.card-body {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.card-desc {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--font-secondary);
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 80px;
		overflow-y: auto;
	}

	.card-desc-empty {
		font-size: 0.85rem;
		color: var(--font-muted);
		margin: 0;
		font-style: italic;
	}

	.metric-count-badge {
		align-self: flex-start;
		font-size: 0.675rem;
		font-weight: 700;
		background-color: var(--table-header);
		color: var(--font-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid var(--panel-border);
	}

	.card-footer {
		border-top: 1px solid var(--panel-border);
		padding-top: 0.75rem;
		margin-top: auto;
	}

	.footer-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	/* Footer View Action Button */
	.btn-view-local {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.825rem;
		font-weight: 600;
		color: var(--primary);
		text-decoration: none;
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--primary-soft);
		background-color: var(--primary-soft);
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);

		&:hover {
			background-color: var(--primary);
			color: #ffffff;
		}
	}

	.btn-compare {
		padding: 0;
		display: flex;
		color: var(--font-secondary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--btn-border);
		background-color: transparent;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast),
			border-color var(--transition-fast);

		&:hover {
			background-color: var(--table-hover);
			color: var(--font-color);
		}
	}

	.cloud-actions {
		display: flex;
		gap: 0.35rem;
		align-items: center;

		/* Make CopyButton nested components align properly */
		:global(button) {
			font-size: 0.8rem;
			padding: 0.4rem 0.75rem;
		}
	}

	.btn-cloud-view {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.1rem;
		height: 2.1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--btn-border);
		color: var(--font-secondary);
		background-color: transparent;
		text-decoration: none;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);

		&:hover {
			background-color: var(--table-hover);
			color: var(--font-color);
		}
	}

	.upload-btn-content {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
</style>
