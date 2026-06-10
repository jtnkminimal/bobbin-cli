import type { CastFile } from "./types.js"

const ANSI_PATTERN = new RegExp(
  [
    "\\x1b\\[[0-9;?:]*[ -/]*[@-~]", // CSI sequences (colors, cursor movement, erase)
    "\\x1b\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\)?", // OSC (window title etc), BEL or ST terminated
    "\\x1b[PX^_][^\\x1b]*(?:\\x1b\\\\)?", // DCS/SOS/PM/APC strings
    "\\x1b[()][0-9A-Za-z]", // charset selection
    "\\x1b.", // any remaining two-char escape
  ].join("|"),
  "g"
)

export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "")
}

// Emulate what a terminal would leave on screen for a single line:
// \r returns the cursor to column 0 (later text overwrites earlier text),
// \b deletes the character before the cursor.
function resolveLine(line: string): string {
  let overwritten = ""
  for (const segment of line.split("\r")) {
    overwritten = segment + overwritten.slice(segment.length)
  }
  let result = ""
  for (const ch of overwritten) {
    if (ch === "\b") result = result.slice(0, -1)
    else result += ch
  }
  return result
}

// Render raw terminal output as plain text: strip escape sequences, resolve
// carriage-return overwrites (progress bars) and backspaces, drop control chars.
// Best-effort — full-screen apps (vim, htop) won't reconstruct faithfully.
export function renderOutput(raw: string): string {
  const stripped = stripAnsi(raw).replace(/\r\n/g, "\n")
  const resolved = stripped.split("\n").map(resolveLine).join("\n")
  return resolved.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
}

export function castToText(cast: CastFile): string {
  let raw = ""
  for (const [, type, data] of cast.events) {
    if (type === "o") raw += data
  }
  return renderOutput(raw)
}
