import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireEnv, optionalEnv } from "@repo/utils";

export function createS3Client() {
  return new S3Client({
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

export async function uploadMp3(input: {
  client: S3Client;
  key: string;
  body: Uint8Array;
  contentType?: string;
}): Promise<string> {
  const bucket = requireEnv("S3_BUCKET");

  await input.client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType ?? "audio/mpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const cdnBaseUrl = optionalEnv("CDN_BASE_URL");

  if (cdnBaseUrl) {
    return `${cdnBaseUrl.replace(/\/$/, "")}/${input.key}`;
  }

  return `https://${bucket}.s3.${requireEnv("AWS_REGION")}.amazonaws.com/${input.key}`;
}
