import { z } from 'zod';

export const SingleMetricSchema = z.object({
	id: z.string(),
	parent: z.string().nullable(),
	start_end_times: z.tuple([z.number(), z.number()]),
});

export const MetricsArraySchema = z.array(SingleMetricSchema);

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
