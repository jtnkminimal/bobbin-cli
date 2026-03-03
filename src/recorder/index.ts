import { CastWriter } from "../cast/writer.js"
import type { CastHeader, BobbinMeta } from "../cast/types.js"
import { detectBackend } from "./detect.js"
import { startPtyRecording } from "./pty-recorder.js"
import { startScriptRecording } from "./script-recorder.js"
import { getGitContext } from "./git.js"

export interface RecordOptions {
  outputFile: string
  command?: string
  args?: string[]
  title?: string
  cols?: number
  rows?: number
}

export interface RecordResult {
  file: string
  duration: number
  exitCode: number
}

export async function record(opts: RecordOptions): Promise<RecordResult> {
  const cols = opts.cols || process.stdout.columns || 80
  const rows = opts.rows || process.stdout.rows || 24
  const git = getGitContext()

  const bobbin: BobbinMeta = {
    version: "0.1.0",
    command: opts.command ? [opts.command, ...(opts.args || [])].join(" ") : undefined,
    git_repo: git.repo,
    git_branch: git.branch,
    git_sha: git.sha,
  }

  const header: CastHeader = {
    version: 2,
    width: cols,
    height: rows,
    timestamp: Math.floor(Date.now() / 1000),
    title: opts.title,
    bobbin,
  }

  const writer = new CastWriter(opts.outputFile, header)
  const startTime = Date.now()

  return new Promise((resolve) => {
    const onExit = async (exitCode: number) => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()

      bobbin.exit_code = exitCode
      await writer.close()

      const duration = (Date.now() - startTime) / 1000
      resolve({ file: opts.outputFile, duration, exitCode })
    }

    const backend = detectBackend()

    if (backend === "pty") {
      startPtyRecording({
        command: opts.command,
        args: opts.args,
        writer,
        cols,
        rows,
        onExit,
      })
    } else {
      startScriptRecording({
        command: opts.command,
        args: opts.args,
        writer,
        onExit,
      })
    }
  })
}
