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
	nbCalls: DeltaMetricDiffSimple;
	average: DeltaMetricDiff;
	min: DeltaMetricDiff;
	max: DeltaMetricDiff;
	cpuTime: DeltaMetricDiff;
};

export type DiffMetric = {
	baseline: EnhancedMetric | null;
	comparison: EnhancedMetric | null;
	delta: DeltaMetrics | null;
	status: DiffStatus;
	children: DiffMetric[];
};

export type DeltaMetricType = 'simple' | 'pct';

export type DeltaMetricDiff = {
	type: DeltaMetricType;
	baseline: number;
	comparison: number;
	delta: number;
	pct: number;
};

export type DeltaMetricDiffSimple = {
	type: DeltaMetricType;
	baseline: number;
	comparison: number;
	delta: number;
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

export const DeltaMetricDiffSimpleSchema = z.object({
	baseline: z.number(),
	comparison: z.number(),
	delta: z.number()
});

export const DeltaMetricDiffSchema = z.object({
	baseline: z.number(),
	comparison: z.number(),
	delta: z.number(),
	pct: z.number()
});

export const DeltaMetricsSchema = z.object({
	nbCalls: DeltaMetricDiffSimpleSchema,
	average: DeltaMetricDiffSchema,
	min: DeltaMetricDiffSchema,
	max: DeltaMetricDiffSchema,
	cpuTime: DeltaMetricDiffSchema
});

export const EnhancedMetricSchema: z.ZodType<EnhancedMetric> = z.object({
	id: z.string(),
	fnId: z.string(),
	caller: z.string().nullable(),
	average: z.number(),
	min: z.number(),
	max: z.number(),
	nbCalls: z.number(),
	cpuTime: z.number(),
	feederId: z.string(),
	selfTime: z.number(),
	selfTimePct: z.number(),
	children: z.array(z.lazy(() => EnhancedMetricSchema))
});

export const DiffMetricSameSchema = z.object({
	baseline: EnhancedMetricSchema,
	comparison: EnhancedMetricSchema,
	delta: DeltaMetricsSchema,
	status: z.literal('same'),
	children: z.array(z.lazy(() => DiffMetricSchema))
});

export const DiffMetricChangedSchema = z.object({
	baseline: EnhancedMetricSchema,
	comparison: EnhancedMetricSchema,
	delta: DeltaMetricsSchema,
	status: z.literal('changed'),
	children: z.array(z.lazy(() => DiffMetricSchema))
});

export const DiffMetricRemovedSchema = z.object({
	baseline: EnhancedMetricSchema,
	comparison: z.null(),
	delta: z.null(),
	status: z.literal('removed'),
	children: z.array(z.lazy(() => DiffMetricSchema))
});

export const DiffMetricAddedSchema = z.object({
	baseline: z.null(),
	comparison: EnhancedMetricSchema,
	delta: z.null(),
	status: z.literal('added'),
	children: z.array(z.lazy(() => DiffMetricSchema))
});

export const DiffMetricSchema: z.ZodType<DiffMetric> = z.discriminatedUnion('status', [
	DiffMetricSameSchema,
	DiffMetricChangedSchema,
	DiffMetricRemovedSchema,
	DiffMetricAddedSchema
]);

export type BenchmarkSource = {
	type: 'local' | 'cloud' | 'live';
	id: string | null;
	label: string;
	metrics: EnhancedMetric[];
};
