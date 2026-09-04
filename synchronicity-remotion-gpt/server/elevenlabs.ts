import type {WordTiming} from '../src/types.js';

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type ElevenLabsResponse = {
  audio_base64: string;
  alignment?: Alignment;
  normalized_alignment?: Alignment;
};

const buildWordTimings = (alignment: Alignment): WordTiming[] => {
  const {characters, character_start_times_seconds: starts, character_end_times_seconds: ends} = alignment;
  const words: WordTiming[] = [];
  let text = '';
  let start: number | null = null;
  let end = 0;

  const flush = () => {
    if (!text.trim() || start === null) return;
    words.push({text: text.trim(), start, end});
    text = '';
    start = null;
  };

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i] ?? '';
    if (/\s/u.test(ch)) {
      flush();
      continue;
    }
    if (start === null) start = starts[i] ?? 0;
    text += ch;
    end = ends[i] ?? starts[i] ?? end;
  }
  flush();
  return words;
};

export const synthesizeWithTiming = async (script: string) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is missing');
  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is missing');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      text: script,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.78,
        style: 0.25,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs failed (${response.status}): ${body.slice(0, 800)}`);
  }

  const data = (await response.json()) as ElevenLabsResponse;
  const alignment = data.normalized_alignment || data.alignment;
  if (!alignment || !data.audio_base64) throw new Error('ElevenLabs response did not contain audio/timing data');

  const words = buildWordTimings(alignment);
  const durationSeconds = Math.max(...alignment.character_end_times_seconds, 0) + 0.25;
  const audioDataUrl = `data:audio/mpeg;base64,${data.audio_base64}`;

  return {audioDataUrl, words, durationSeconds};
};
