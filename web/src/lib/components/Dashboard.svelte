<script lang="ts">
	import { base64UrlEncode, copy } from '$lib/utils';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import AsyncButton from './AsyncButton.svelte';
	import CopyButton from './CopyButton.svelte';
	import { onMount } from 'svelte';

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
	<!-- Card Top/Header with Title & Delete action -->
	<div class="card-header">
		<div class="header-left">
			<h2 class="card-title" title={dashboard.entity.title}>{dashboard.entity.title}</h2>
			<div class="card-date">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				{formatDate(new Date(dashboard.entity.date.toString()))}
			</div>
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M3 6h18" />
				<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
				<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
			</svg>
		</button>
	</div>

	<div class="card-body">
		{#if dashboard.entity.description && dashboard.entity.description.trim()}
			<pre class="card-desc">{dashboard.entity.description}</pre>
		{:else}
			<p class="card-desc-empty">No snapshot description provided.</p>
		{/if}
	</div>

	<!-- Card Footer / Actions -->
	<div class="card-footer">
		<div class="footer-actions">
			<!-- View Local Profile Action -->
			<a href={resolve('/view') + `?local_id=${dashboard.id}`} class="btn-view-local">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
				View Local
			</a>

			<!-- Cloud Sharing Actions -->
			<div class="cloud-actions">
				{#if dashboard.firebaseId}
					<!-- If uploaded, allow direct viewing or link copy -->
					<a
						href={resolve('/share') + `?id=${dashboard.firebaseId}`}
						class="btn-cloud-view"
						aria-label="View from cloud"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path
								d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47-.47-1.12-1-2.5-1-2.28 0-4 1.72-4 4 0 .3 0 .7.05 1a5.85 5.85 0 0 0-4.55 5.5c0 3 2.5 5 5.5 5h10"
							/>
						</svg>
					</a>
					<CopyButton
						beforeCopyText={'Share link'}
						text={page.url.origin + resolve('/share') + `?id=${dashboard.firebaseId}`}
					></CopyButton>
				{:else}
					<!-- If not uploaded yet, show Upload Button -->
					{#snippet idleView()}
						<span class="upload-btn-content">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17 8 12 3 7 8" />
								<line x1="12" y1="3" x2="12" y2="15" />
							</svg>
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
			transform: translateY(-2px);
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
