import { spawn } from "node:child_process"
import { mkdtemp, unlink, rmdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { CastWriter } from "../cast/writer.js"

function shellEscape(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'"
}

export interface ScriptRecorderOpts {
  command?: string
  args?: string[]
  writer: CastWriter
  onExit: (code: number) => void
}

export async function startScriptRecording(opts: ScriptRecorderOpts): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), "bobbin-"))
  const typescriptFile = join(tempDir, "typescript")

  const isLinux = process.platform === "linux"

  let scriptArgs: string[]

  if (opts.command) {
    const fullCmd = [opts.command, ...(opts.args || [])].map(shellEscape).join(" ")
    if (isLinux) {
      scriptArgs = ["-qfc", fullCmd, typescriptFile]
    } else {
      scriptArgs = ["-qF", typescriptFile, fullCmd]
    }
  } else {
    // Interactive shell
    if (isLinux) {
      scriptArgs = ["-qf", typescriptFile]
    } else {
      scriptArgs = ["-qF", typescriptFile]
    }
  }

  const proc = spawn("script", scriptArgs, {
    stdio: ["inherit", "pipe", "inherit"],
  })

  if (proc.stdout) {
    proc.stdout.on("data", (data: Buffer) => {
      const str = data.toString()
      opts.writer.writeEvent(str, "o")
      process.stdout.write(str)
    })
  }

  proc.on("close", async (code) => {
    await unlink(typescriptFile).catch(() => {})
    await rmdir(tempDir).catch(() => {})
    opts.onExit(code ?? 0)
  })
}
