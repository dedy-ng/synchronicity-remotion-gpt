import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import cors from 'cors';
import express from 'express';
import {z} from 'zod';
import {createJob, getJob} from './jobs.js';
import {processRender} from './render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use('/renders', express.static(path.join(root, 'renders'), {maxAge: '7d'}));

const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expected = process.env.API_KEY;
  if (!expected) return res.status(500).json({error: 'API_KEY is not configured'});
  const supplied = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!supplied || supplied !== expected) return res.status(401).json({error: 'Unauthorized'});
  next();
};

const SegmentSchema = z.object({
  text: z.string().min(1),
  emphasis: z.array(z.string()).max(3).optional(),
  accent: z.enum(['purple', 'cyan', 'green', 'orange', 'white']).optional(),
  effect: z.enum(['ring', 'burst', 'tunnel', 'minimal']).optional(),
  intensity: z.number().min(0.25).max(1).optional(),
});

const RenderSchema = z.object({
  script: z.string().min(3).max(10000),
  segments: z.array(SegmentSchema).max(200).optional(),
});

app.get('/health', (_req, res) => res.json({ok: true}));

app.post('/v1/renders', auth, (req, res) => {
  const parsed = RenderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error: 'Invalid request', details: parsed.error.flatten()});

  const jobId = crypto.randomUUID();
  createJob(jobId);
  void processRender({jobId, script: parsed.data.script.trim(), plannedSegments: parsed.data.segments});

  return res.status(202).json({
    job_id: jobId,
    status: 'queued',
    status_url: `/v1/renders/${jobId}`,
  });
});

app.get('/v1/renders/:id', auth, async (req, res) => {
  const waitSeconds = Math.max(0, Math.min(25, Number(req.query.wait_seconds || 0)));
  const deadline = Date.now() + waitSeconds * 1000;

  while (Date.now() < deadline) {
    const current = getJob(req.params.id);
    if (!current) return res.status(404).json({error: 'Render job not found'});
    if (current.status === 'completed' || current.status === 'failed') return res.json(current);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({error: 'Render job not found'});
  return res.json(job);
});

app.listen(port, () => {
  console.log(`Synchronicity renderer listening on http://localhost:${port}`);
});
