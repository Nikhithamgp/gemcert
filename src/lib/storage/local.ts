import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertValidKey, type ObjectStorage, type StoredObject } from "./keys";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png" };

/**
 * Development-only adapter that writes objects under a local folder.
 * Not suitable for production on PaaS hosts whose disks are ephemeral.
 */
export class LocalStorage implements ObjectStorage {
  private readonly root: string;

  constructor(dir: string) {
    this.root = path.resolve(dir);
  }

  private resolve(key: string) {
    assertValidKey(key);
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid object key");
    return full;
  }

  async put(key: string, body: Buffer) {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const file = this.resolve(key);
      const body = await readFile(file);
      return { body, contentType: TYPES[path.extname(file)] ?? "application/octet-stream" };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}
