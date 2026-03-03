import { program } from "commander"
import { recCommand } from "./commands/rec.js"
import { playCommand } from "./commands/play.js"
import { uploadCommand } from "./commands/upload.js"
import { downloadCommand } from "./commands/download.js"
import { lsCommand } from "./commands/ls.js"
import { handleError } from "./errors.js"

process.on("uncaughtException", (err) => {
  handleError(err)
  process.exit(1)
})

process.on("unhandledRejection", (err) => {
  handleError(err instanceof Error ? err : new Error(String(err)))
  process.exit(1)
})

program
  .name("bobbin")
  .description("Agent-first terminal recording")
  .version("0.1.2", "-v, --version")

program
  .command("rec")
  .description("Record a terminal session")
  .option("-o, --output <file>", "Output file path")
  .option("-t, --title <title>", "Recording title")
  .option("--json", "JSON output for agents")
  .argument("[command...]", "Command to record (everything after --)")
  .action(async (commandArgs: string[], opts) => {
    try { await recCommand(commandArgs, opts) } catch (e) { handleError(e); process.exit(1) }
  })

program
  .command("play")
  .description("Play back a recording in the terminal")
  .argument("<file>", "Cast file, recording ID, or bobbin.work URL")
  .option("-s, --speed <speed>", "Playback speed multiplier", "1")
  .option("--server <url>", "Bobbin server URL")
  .option("--json", "JSON output for agents")
  .action(async (file: string, opts) => {
    try { await playCommand(file, opts) } catch (e) { handleError(e); process.exit(1) }
  })

program
  .command("upload")
  .description("Upload a recording and get a shareable URL")
  .argument("<file>", "Cast file to upload")
  .option("-t, --title <title>", "Recording title")
  .option("--server <url>", "Bobbin server URL")
  .option("--json", "JSON output for agents")
  .action(async (file: string, opts) => {
    try { await uploadCommand(file, opts) } catch (e) { handleError(e); process.exit(1) }
  })

program
  .command("download")
  .description("Download a recording")
  .argument("<id>", "Recording ID or URL")
  .option("-o, --output <file>", "Output file path")
  .option("--server <url>", "Bobbin server URL")
  .option("--json", "JSON output for agents")
  .action(async (id: string, opts) => {
    try { await downloadCommand(id, opts) } catch (e) { handleError(e); process.exit(1) }
  })

program
  .command("ls")
  .description("List recordings")
  .option("--remote", "List uploaded recordings")
  .option("--json", "JSON output for agents")
  .action(async (opts) => {
    try { await lsCommand(opts) } catch (e) { handleError(e); process.exit(1) }
  })

program.parse()
