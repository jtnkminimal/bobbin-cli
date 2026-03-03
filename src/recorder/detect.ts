export type RecorderBackend = "pty" | "script"

export function detectBackend(): RecorderBackend {
  try {
    require.resolve("node-pty")
    return "pty"
  } catch {
    return "script"
  }
}
