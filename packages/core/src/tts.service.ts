import type { PrismaClient } from "@repo/db";
import { requireEnv } from "@repo/utils";
import { estimateSpokenDurationSec } from "./text";
import { createS3Client, uploadMp3 } from "./storage.service";

const ELEVENLABS_MODEL = "eleven_multilingual_v2";

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
  const voiceId = requireEnv("ELEVENLABS_VOICE_ID");
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": requireEnv("ELEVENLABS_API_KEY"),
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs request failed: ${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}
