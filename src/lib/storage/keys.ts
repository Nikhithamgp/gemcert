/** Object keys are generated server-side; anything else is rejected (no path traversal). */
export const OBJECT_KEY_PATTERN = /^(certificates|branding)\/[a-f0-9-]{36}\.(jpg|png)$/;

export function assertValidKey(key: string) {
  if (!OBJECT_KEY_PATTERN.test(key)) throw new Error("Invalid object key");
}

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}
