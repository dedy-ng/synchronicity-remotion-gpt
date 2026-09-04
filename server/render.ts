import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {PlannedSegment, SynchronicityVideoProps} from '../src/types.js';
import {synthesizeWithTiming} from './elevenlabs.js';
import {timePlannedSegments} from './segments.js';
import {patchJob} from './jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const renderDir = path.join(root, 'renders');
let bundlePromise: Promise<string> | null = null;

const getBundle = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(root, 'src', 'index.ts'),
      webpackOverride: (config) => {
        // The project uses NodeNext-style `.js` import specifiers in TypeScript source
        // (for example `./Root.js`). During Remotion's Webpack bundle those files
        // physically exist as `.ts` / `.tsx`, so alias explicit `.js` imports back
        // to their TypeScript source counterparts.
        const resolve = (config.resolve ?? {}) as typeof config.resolve & {
          extensionAlias?: Record<string, string[]>;
        };
        resolve.extensionAlias = {
          ...(resolve.extensionAlias ?? {}),
          '.js': ['.tsx', '.ts', '.js'],
        };
        config.resolve = resolve;
        return config;
      },
    });
  }
  return bundlePromise;
};

export const processRender = async ({
  jobId,
  script,
  plannedSegments,
}: {
  jobId: string;
  script: string;
  plannedSegments?: PlannedSegment[];
}) => {
  try {
    patchJob(jobId, {status: 'voice', progress: 0.08});
    const {audioDataUrl, words, durationSeconds} = await synthesizeWithTiming(script);
    const segments = timePlannedSegments(plannedSegments, words);
    patchJob(jobId, {status: 'rendering', progress: 0.2});

    const inputProps: SynchronicityVideoProps = {
      script,
      audioDataUrl,
      durationSeconds,
      segments,
      logoUrl: process.env.LOGO_URL || undefined,
    };

    await mkdir(renderDir, {recursive: true});
    const serveUrl = await getBundle();
    const composition = await selectComposition({
      serveUrl,
      id: 'SynchronicityShort',
      inputProps,
      timeoutInMilliseconds: 120_000,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    const outputLocation = path.join(renderDir, `${jobId}.mp4`);
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation,
      inputProps,
      crf: 18,
      x264Preset: 'veryfast',
      pixelFormat: 'yuv420p',
      concurrency: process.env.RENDER_CONCURRENCY || '50%',
      timeoutInMilliseconds: 120_000,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
      onProgress: ({progress}) => patchJob(jobId, {progress: 0.2 + progress * 0.78}),
    });

    const base = (process.env.PUBLIC_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    patchJob(jobId, {status: 'completed', progress: 1, videoUrl: `${base}/renders/${jobId}.mp4`});
  } catch (error) {
    patchJob(jobId, {
      status: 'failed',
      progress: 1,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
