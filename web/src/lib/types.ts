import { z } from 'zod';

export const SingleMetricSchema = z.object({
	id: z.string(),
	parent: z.string().nullable(),
	start_end_times: z.tuple([z.number(), z.number()])
});

export const MetricsArraySchema = z.array(SingleMetricSchema);

const ObservationSchema = z.object({
	type: z.literal('observation'),
	msg: MetricsArraySchema,
	feeder_id: z.string()
});

const NewFeederSchema = z.object({
	type: z.literal('new_feeder'),
	name: z.string()
});

const RageQuitFeederSchema = z.object({
	type: z.literal('rage_quit_feeder'),
	name: z.string()
});

const OnlineFeedersSchema = z.object({
	type: z.literal('online_feeders'),
	feeder_ids: z.array(z.string())
});

export const FeederMessageSchema = z.discriminatedUnion('type', [
	ObservationSchema,
	NewFeederSchema,
	RageQuitFeederSchema,
	OnlineFeedersSchema
]);

export type FeederMessage = z.infer<typeof FeederMessageSchema>;

export type SingleMetric = z.infer<typeof SingleMetricSchema>;

export type Metric = {
	id: string;
	parent: string | null;
	start_end_times: number[][];
};

export type EnhancedMetric = {
	id: string;
	parent: string | null;
	average: number;
	min: number;
	max: number;
	nbCalls: number;
	cpu_time: number;
	children: EnhancedMetric[];
};
