import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import { getRecordingsDir, loadUploads } from "../config.js"
import { parseCastFile } from "../cast/reader.js"
import { output } from "../output.js"

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export interface LsOptions {
  remote?: boolean
  json?: boolean
}

export async function lsCommand(opts: LsOptions): Promise<void> {
  const jsonMode = opts.json || false

  if (opts.remote) {
    const store = await loadUploads()
    if (jsonMode) {
      output(store.uploads, true)
    } else {
      if (store.uploads.length === 0) {
        console.log("No uploaded recordings.")
        return
      }
      for (const upload of store.uploads) {
        console.log(`  ${upload.id}  ${upload.title || upload.file}  ${upload.url}`)
      }
    }
    return
  }

  const dir = await getRecordingsDir()
  const files = await readdir(dir)
  const castFiles = files.filter((f) => f.endsWith(".cast"))

  if (castFiles.length === 0) {
    if (!jsonMode) console.log("No local recordings.")
    if (jsonMode) output([], true)
    return
  }

  const recordings = []
  for (const file of castFiles) {
    const filePath = join(dir, file)
    const fileStat = await stat(filePath)
    try {
      const cast = await parseCastFile(filePath)
      recordings.push({
        file,
        path: filePath,
        size: fileStat.size,
        duration: cast.events.length > 0 ? cast.events[cast.events.length - 1][0] : 0,
        command: cast.header.bobbin?.command,
        date: new Date(fileStat.mtime).toISOString(),
      })
    } catch {
      recordings.push({
        file,
        path: filePath,
        size: fileStat.size,
        date: new Date(fileStat.mtime).toISOString(),
      })
    }
  }

  recordings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (jsonMode) {
    output(recordings, true)
  } else {
    const rows = recordings.map((rec) => ({
      file: rec.file,
      duration: rec.duration ? formatDuration(rec.duration) : "?",
      size: formatSize(rec.size),
      date: formatDate(rec.date),
      command: rec.command || "",
      path: rec.path,
    }))

    const cols = {
      file: Math.max(4, ...rows.map((r) => r.file.length)),
      duration: Math.max(8, ...rows.map((r) => r.duration.length)),
      size: Math.max(4, ...rows.map((r) => r.size.length)),
      date: Math.max(4, ...rows.map((r) => r.date.length)),
      command: Math.max(7, ...rows.map((r) => r.command.length)),
    }

    const header =
      "  " +
      "File".padEnd(cols.file) + "  " +
      "Duration".padEnd(cols.duration) + "  " +
      "Size".padEnd(cols.size) + "  " +
      "Date".padEnd(cols.date) + "  " +
      "Command"
    const sep =
      "  " +
      "─".repeat(cols.file) + "  " +
      "─".repeat(cols.duration) + "  " +
      "─".repeat(cols.size) + "  " +
      "─".repeat(cols.date) + "  " +
      "─".repeat(cols.command)

    console.log(header)
    console.log(sep)
    for (const row of rows) {
      console.log(
        "  " +
        row.file.padEnd(cols.file) + "  " +
        row.duration.padEnd(cols.duration) + "  " +
        row.size.padEnd(cols.size) + "  " +
        row.date.padEnd(cols.date) + "  " +
        row.command
      )
    }
    console.log()
    console.log(`  Path: ${recordings[0]?.path.replace(/\/[^/]+$/, "/")}`)
  }
}
