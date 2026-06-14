import { z } from 'zod';

export const SingleMetricSchema = z.object({
	id: z.string(),
	parent: z.string().nullable(),
	start_end_times: z.tuple([z.number(), z.number()])
});

export const SingleMetricWithSourceSchema = z.object({
	id: z.string(),
	parent: z.string().nullable(),
	start_end_times: z.tuple([z.number(), z.number()]),
	feeder_id: z.string()
});

export const MetricsArraySchema = z.array(SingleMetricSchema);

const ObservationSchema = z.object({
	type: z.literal('observation'),
	msg: MetricsArraySchema,
	feeder_id: z.string()
});

const NewFeederSchema = z.object({
	type: z.literal('new_feeder'),
	name: z.string(),
	id: z.string()
});

const RageQuitFeederSchema = z.object({
	type: z.literal('rage_quit_feeder'),
	name: z.string(),
	id: z.string()
});

const OnlineFeedersSchema = z.object({
	type: z.literal('online_feeders'),
	feeder_ids: z.array(
		z.object({
			id: z.string(),
			name: z.string()
		})
	)
});

export const FeederMessageSchema = z.discriminatedUnion('type', [
	ObservationSchema,
	NewFeederSchema,
	RageQuitFeederSchema,
	OnlineFeedersSchema
]);

export type FeederMessage = z.infer<typeof FeederMessageSchema>;

export type SingleMetric = z.infer<typeof SingleMetricSchema>;

export type SingleMetricWithSource = z.infer<typeof SingleMetricWithSourceSchema>;

export type Metric = {
	id: string;
	parent: string | null;
	start_end_times: number[][];
	feeder_id: string;
};

export type EnhancedMetric = {
	id: string;
	fnId: string;
	caller: string | null;
	average: number;
	min: number;
	max: number;
	nbCalls: number;
	cpuTime: number;
	feederId: string;
	selfTime: number;
	selfTimePct: number;
	children: EnhancedMetric[];
};

export type DiffStatus = 'same' | 'changed' | 'added' | 'removed';

export type DeltaMetrics = {
	cpuTime: number;
	cpuTimePct: number;
	average: number;
	averagePct: number;
	nbCalls: number;
	nbCallsPct: number;
	selfTime: number;
	selfTimePct: number;
};

export type DiffMetric = {
	baseline: EnhancedMetric | null;
	comparison: EnhancedMetric | null;
	delta: DeltaMetrics | null;
	status: DiffStatus;
	children: DiffMetric[];
};

export type DiffResult = {
	rootNodes: DiffMetric[];
	summary: {
		totalFunctions: number;
		improved: number;
		regressed: number;
		added: number;
		removed: number;
	};
};

export type BenchmarkSource = {
	type: 'local' | 'cloud' | 'live';
	id: string | null;
	label: string;
	metrics: EnhancedMetric[];
};
