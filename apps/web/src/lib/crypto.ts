import crypto from "crypto";

const RAW_KEY = process.env.WK_TOKEN_ENCRYPTION_KEY ?? "";
if (RAW_KEY.length < 32) {
    throw new Error("WK_TOKEN_ENCRYPTION_KEY must be at least 32 characters.");
}

const KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

export function encryptToken(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptToken(enc: string): string {
    const [ivB64, tagB64, ctB64] = enc.split(".");
    if (!ivB64 || !tagB64 || !ctB64) throw new Error("invalud encrypted token format.");

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plaintext.toString("utf8");
}