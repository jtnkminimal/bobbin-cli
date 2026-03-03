import type { CastWriter } from "../cast/writer.js"

export interface PtyRecorderOpts {
  command?: string
  args?: string[]
  writer: CastWriter
  cols: number
  rows: number
  onExit: (code: number) => void
}

export function startPtyRecording(opts: PtyRecorderOpts): void {
  const pty = require("node-pty")

  const shell = opts.command || process.env.SHELL || "/bin/bash"
  const args = opts.args || []

  const proc = pty.spawn(shell, args, {
    name: "xterm-256color",
    cols: opts.cols,
    rows: opts.rows,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  })

  proc.onData((data: string) => {
    opts.writer.writeEvent(data, "o")
    process.stdout.write(data)
  })

  proc.onExit(({ exitCode }: { exitCode: number }) => {
    opts.onExit(exitCode)
  })

  // Forward stdin to the PTY
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()
  process.stdin.on("data", (data) => {
    proc.write(data.toString())
  })

  // Handle resize
  process.stdout.on("resize", () => {
    const newCols = process.stdout.columns || 80
    const newRows = process.stdout.rows || 24
    proc.resize(newCols, newRows)
  })
}
