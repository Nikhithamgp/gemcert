import "server-only";
import { env } from "@/lib/env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { ObjectStorage } from "./keys";

export type { ObjectStorage, StoredObject } from "./keys";
export { OBJECT_KEY_PATTERN, assertValidKey } from "./keys";

let instance: ObjectStorage | undefined;

export function storage(): ObjectStorage {
  if (!instance) {
    const e = env();
    if (e.STORAGE_DRIVER === "s3") {
      if (!e.S3_BUCKET || !e.S3_ACCESS_KEY_ID || !e.S3_SECRET_ACCESS_KEY) {
        throw new Error("STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY");
      }
      instance = new S3Storage({
        endpoint: e.S3_ENDPOINT || undefined,
        region: e.S3_REGION || "auto",
        bucket: e.S3_BUCKET,
        accessKeyId: e.S3_ACCESS_KEY_ID,
        secretAccessKey: e.S3_SECRET_ACCESS_KEY,
      });
    } else {
      instance = new LocalStorage(e.LOCAL_STORAGE_DIR);
    }
  }
  return instance;
}
