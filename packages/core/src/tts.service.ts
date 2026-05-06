import type { PrismaClient } from "@repo/db";
import { optionalEnv, requireEnv } from "@repo/utils";
import { estimateSpokenDurationSec } from "./text";
import { createS3Client, uploadMp3 } from "./storage.service";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
/** OpenAI Speech API input limit is 4096; stay under for safety. */
const MAX_TTS_INPUT_CHARS = 3800;

export async function generateAudioForContent(prisma: PrismaClient, contentId: string): Promise<string> {
  const content = await prisma.content.findUniqueOrThrow({
    where: {
      id: contentId,
    },
  });

  const speechText = `Here are your latest headlines. ${content.text}`;
  const audio = await synthesizeSpeech(speechText);
  const key = `audio/headlines/${content.id}.mp3`;
  const url = await uploadMp3({
    client: createS3Client(),
    key,
    body: audio,
  });

  const stored = await prisma.audio.create({
    data: {
      contentId: content.id,
      url,
      durationSec: estimateSpokenDurationSec(speechText),
      type: "headline",
    },
  });

  return stored.id;
}

export async function generateAudioForBulletin(prisma: PrismaClient, bulletinId: string): Promise<string> {
  const bulletin = await prisma.bulletin.findUniqueOrThrow({
    where: {
      id: bulletinId,
    },
  });

  const audio = await synthesizeSpeech(bulletin.script);
  const key = `audio/bulletins/${bulletin.id}.mp3`;
  const url = await uploadMp3({
    client: createS3Client(),
    key,
    body: audio,
  });

  const stored = await prisma.audio.create({
    data: {
      bulletinId: bulletin.id,
      url,
      durationSec: bulletin.durationSec,
      type: "bulletin",
    },
  });

  return stored.id;
}

export async function synthesizeSpeech(text: string): Promise<Uint8Array> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("OpenAI speech: empty input text");
  }

  const segments = splitTextForTts(trimmed);
  const mp3Chunks: Uint8Array[] = [];

  for (const segment of segments) {
    mp3Chunks.push(await fetchOpenAiSpeechMp3(segment));
  }

  return mergeUint8Arrays(mp3Chunks);
}

function mergeUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

async function fetchOpenAiSpeechMp3(input: string): Promise<Uint8Array> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = optionalEnv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts");
  const voice = optionalEnv("OPENAI_TTS_VOICE", "onyx");
  const speedParsed = Number.parseFloat(optionalEnv("OPENAI_TTS_SPEED", "1"));
  const speed = Number.isFinite(speedParsed) ? Math.min(4, Math.max(0.25, speedParsed)) : 1;

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      response_format: "mp3",
      speed,
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errBody: unknown = await response.json();
      if (
        errBody &&
        typeof errBody === "object" &&
        "error" in errBody &&
        errBody.error &&
        typeof errBody.error === "object" &&
        "message" in errBody.error &&
        typeof errBody.error.message === "string"
      ) {
        detail = errBody.error.message;
      } else {
        detail = JSON.stringify(errBody).slice(0, 400);
      }
    } catch {
      detail = (await response.text()).slice(0, 400);
    }
    throw new Error(`OpenAI speech failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ""}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Split long scripts into segments under OpenAI's per-request character cap,
 * preferring paragraph boundaries, then sentences, then words.
 */
function splitTextForTts(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_TTS_INPUT_CHARS) {
    return [trimmed];
  }

  const chunks: string[] = [];
  const paragraphs = trimmed.split(/\n\s*\n/);

  let carry = "";
  const flushCarry = () => {
    if (carry.trim()) {
      chunks.push(carry.trim());
      carry = "";
    }
  };

  for (const paragraph of paragraphs) {
    const p = paragraph.trim();
    if (!p) continue;

    if (p.length > MAX_TTS_INPUT_CHARS) {
      flushCarry();
      chunks.push(...splitLargeBlock(p));
      continue;
    }

    const joined = carry ? `${carry}\n\n${p}` : p;
    if (joined.length <= MAX_TTS_INPUT_CHARS) {
      carry = joined;
    } else {
      flushCarry();
      carry = p;
    }
  }
  flushCarry();

  return chunks.length > 0 ? chunks : [trimmed.slice(0, MAX_TTS_INPUT_CHARS)];
}

function splitLargeBlock(block: string): string[] {
  const sentences = block.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [block];
  const chunks: string[] = [];
  let carry = "";

  const flush = () => {
    if (carry.trim()) {
      chunks.push(carry.trim());
      carry = "";
    }
  };

  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;

    if (s.length > MAX_TTS_INPUT_CHARS) {
      flush();
      chunks.push(...splitByWords(s));
      continue;
    }

    const joined = carry ? `${carry} ${s}` : s;
    if (joined.length <= MAX_TTS_INPUT_CHARS) {
      carry = joined;
    } else {
      flush();
      carry = s;
    }
  }
  flush();

  return chunks.length > 0 ? chunks : splitByWords(block);
}

function splitByWords(block: string): string[] {
  const words = block.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let carry = "";

  const pushHardSlices = (word: string) => {
    for (let i = 0; i < word.length; i += MAX_TTS_INPUT_CHARS) {
      chunks.push(word.slice(i, i + MAX_TTS_INPUT_CHARS));
    }
  };

  for (const w of words) {
    if (w.length > MAX_TTS_INPUT_CHARS) {
      if (carry) {
        chunks.push(carry);
        carry = "";
      }
      pushHardSlices(w);
      continue;
    }

    const joined = carry ? `${carry} ${w}` : w;
    if (joined.length <= MAX_TTS_INPUT_CHARS) {
      carry = joined;
    } else {
      if (carry) chunks.push(carry);
      carry = w;
    }
  }

  if (carry) chunks.push(carry);
  return chunks;
}
