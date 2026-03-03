import { readFile } from "node:fs/promises"
import type { CastHeader, CastEvent, CastFile } from "./types.js"

export async function parseCastFile(filePath: string): Promise<CastFile> {
  const content = await readFile(filePath, "utf-8")
  return parseCastString(content)
}

export function parseCastString(content: string): CastFile {
  const lines = content.trim().split("\n")
  if (lines.length === 0) {
    throw new Error("Empty cast file")
  }

  const header: CastHeader = JSON.parse(lines[0])
  if (header.version !== 2) {
    throw new Error(`Unsupported asciicast version: ${header.version}`)
  }

  const events: CastEvent[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      events.push(JSON.parse(lines[i]))
    }
  }

  return { header, events }
}
