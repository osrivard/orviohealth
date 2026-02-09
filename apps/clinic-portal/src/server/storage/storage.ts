import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface StoredFile {
  storageKey: string;
  sha256: string;
}

export interface StorageDriver {
  putBytes(storageKey: string, data: Buffer): Promise<StoredFile>;
  getBytes(storageKey: string): Promise<Buffer>;
}

function getLocalDir(): string {
  const dir = process.env.LOCAL_STORAGE_DIR || './data';
  return dir;
}

export class LocalStorageDriver implements StorageDriver {
  async putBytes(storageKey: string, data: Buffer): Promise<StoredFile> {
    const dir = getLocalDir();
    await fs.mkdir(dir, { recursive: true });

    const full = path.join(dir, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);

    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    return { storageKey, sha256 };
  }

  async getBytes(storageKey: string): Promise<Buffer> {
    const dir = getLocalDir();
    const full = path.join(dir, storageKey);
    return await fs.readFile(full);
  }
}

export function getStorageDriver(): StorageDriver {
  // TODO: add S3 driver for Canada region (Montreal).
  // Keep the interface the same so you can swap easily.
  return new LocalStorageDriver();
}
