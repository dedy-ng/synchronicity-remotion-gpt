export type JobStatus = 'queued' | 'voice' | 'rendering' | 'completed' | 'failed';

export type RenderJob = {
  id: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  videoUrl?: string;
  error?: string;
};

const jobs = new Map<string, RenderJob>();

export const createJob = (id: string): RenderJob => {
  const job: RenderJob = {id, status: 'queued', progress: 0, createdAt: Date.now()};
  jobs.set(id, job);
  return job;
};

export const getJob = (id: string) => jobs.get(id);

export const patchJob = (id: string, patch: Partial<RenderJob>) => {
  const current = jobs.get(id);
  if (!current) return;
  jobs.set(id, {...current, ...patch});
};
