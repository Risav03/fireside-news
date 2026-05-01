export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const durationSec = kind === "bed" ? 12 : 8;
  const wav = createToneWav(durationSec, kind === "bed" ? 164 : 440);

  return new Response(wav, {
    headers: {
      "content-type": "audio/wav",
      "cache-control": "public, max-age=86400",
    },
  });
}

function createToneWav(durationSec: number, frequency: number): ArrayBuffer {
  const sampleRate = 22_050;
  const samples = sampleRate * durationSec;
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t / 0.25, (durationSec - t) / 0.25);
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.08 * Math.max(0, envelope);
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
