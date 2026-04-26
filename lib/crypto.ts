import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey() {
  const secret = process.env.GROUPME_TOKEN_ENCRYPTION_SECRET;
  if (!secret) throw new Error("Missing GROUPME_TOKEN_ENCRYPTION_SECRET");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [prefix, version, ivRaw, tagRaw, dataRaw] = payload.split(":");
  if (prefix !== "enc" || version !== "v1" || !ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted payload format");
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
