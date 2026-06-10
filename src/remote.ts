import { validateServerUrl } from "./config.js"

export const MAX_RECORDING_SIZE = 10 * 1024 * 1024 // 10 MB

export function isRemote(input: string): boolean {
  // Full URL like https://bobbin.work/r/P2fumq1n
  if (/^https?:\/\//.test(input)) return true
  // Bare domain URL like bobbin.work/r/P2fumq1n
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(input)) return true
  // Bare key like P2fumq1n (alphanumeric, no path separators, no .cast extension)
  if (/^[a-zA-Z0-9_-]+$/.test(input) && !input.endsWith(".cast")) return true
  return false
}

export function extractId(input: string): string {
  const raw = input.includes("/") ? input.split("/").pop()! : input
  const id = raw.replace(/[^a-zA-Z0-9_-]/g, "")
  if (!id) {
    throw new Error("Invalid recording ID")
  }
  return id
}

export async function fetchRecordingText(id: string, server: string): Promise<string> {
  validateServerUrl(server)
  const response = await fetch(`${server}/api/r/${encodeURIComponent(id)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch recording: ${response.status}`)
  }
  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_RECORDING_SIZE) {
    throw new Error("Recording too large (limit 10 MB)")
  }
  const content = await response.text()
  if (content.length > MAX_RECORDING_SIZE) {
    throw new Error("Recording too large (limit 10 MB)")
  }
  return content
}
