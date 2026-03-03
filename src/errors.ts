interface NodeError extends Error {
  code?: string
  syscall?: string
  path?: string
  hostname?: string
  cause?: Error & { code?: string }
}

function sanitize(s: string): string {
  return s.replace(/[\x00-\x1f\x7f]/g, "")
}

export function handleError(err: unknown): void {
  const error = err as NodeError

  // File system errors
  if (error.code === "ENOENT") {
    const path = error.path ? sanitize(error.path) : "unknown"
    console.error(`Error: File not found: ${path}`)
    return
  }
  if (error.code === "EACCES") {
    const path = error.path ? sanitize(error.path) : "unknown"
    console.error(`Error: Permission denied: ${path}`)
    return
  }
  if (error.code === "EISDIR") {
    const path = error.path ? sanitize(error.path) : "unknown"
    console.error(`Error: Expected a file but got a directory: ${path}`)
    return
  }

  // Network errors
  if (error.code === "ECONNREFUSED" || error.cause?.code === "ECONNREFUSED") {
    console.error(`Error: Could not connect to server. Is the URL correct?`)
    return
  }
  if (error.code === "ENOTFOUND" || error.cause?.code === "ENOTFOUND") {
    console.error(`Error: Server not found. Check the URL and your network connection.`)
    return
  }
  if (error.code === "ETIMEDOUT" || error.cause?.code === "ETIMEDOUT") {
    console.error(`Error: Connection timed out.`)
    return
  }
  if (error.name === "AbortError" || error.code === "ABORT_ERR") {
    console.error(`Error: Request timed out.`)
    return
  }

  // JSON parse errors (malformed cast files)
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    console.error(`Error: Invalid recording file — could not parse contents.`)
    return
  }

  // Cast format errors
  if (error.message?.startsWith("Unsupported asciicast version")) {
    console.error(`Error: ${error.message}`)
    return
  }
  if (error.message?.startsWith("Empty cast file")) {
    console.error(`Error: Recording file is empty.`)
    return
  }

  // Fallback — print the message without the stack trace
  // Sanitize to prevent terminal control character injection
  const message = sanitize(error.message || String(err))
  console.error(`Error: ${message}`)
}
