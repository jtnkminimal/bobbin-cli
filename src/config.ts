import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { homedir } from "node:os"

const CONFIG_DIR = join(homedir(), ".config", "bobbin")
const UPLOADS_FILE = join(CONFIG_DIR, "uploads.json")
const RECORDINGS_DIR = join(CONFIG_DIR, "recordings")

interface UploadRecord {
  id: string
  key: string
  file: string
  title?: string
  uploadedAt: string
  url: string
}

interface UploadsStore {
  uploads: UploadRecord[]
}

export async function getRecordingsDir(): Promise<string> {
  await mkdir(RECORDINGS_DIR, { recursive: true, mode: 0o700 })
  return RECORDINGS_DIR
}

export async function saveUpload(record: UploadRecord): Promise<void> {
  const store = await loadUploads()
  store.uploads.push(record)
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })
  await writeFile(UPLOADS_FILE, JSON.stringify(store, null, 2), { mode: 0o600 })
}

export async function loadUploads(): Promise<UploadsStore> {
  try {
    const data = await readFile(UPLOADS_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return { uploads: [] }
  }
}

export function getDefaultServer(): string {
  return process.env.BOBBIN_SERVER || "https://bobbin.work"
}

export function validateServerUrl(url: string): void {
  if (!/^https?:\/\//.test(url)) {
    console.error(`Invalid server URL: ${url} (must start with http:// or https://)`)
    process.exit(1)
  }
  if (url.startsWith("http://")) {
    console.error(`Warning: using insecure HTTP connection to ${url}`)
  }
}
