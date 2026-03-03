import { readFile } from "node:fs/promises"
import { basename } from "node:path"
import { getDefaultServer, saveUpload, validateServerUrl } from "../config.js"
import { output, info } from "../output.js"

export interface UploadOptions {
  title?: string
  server?: string
  json?: boolean
}

export async function uploadCommand(file: string, opts: UploadOptions): Promise<void> {
  const jsonMode = opts.json || false
  const server = opts.server || getDefaultServer()
  validateServerUrl(server)

  info(`Uploading ${file} to ${server}...`, jsonMode)

  const content = await readFile(file)
  const formData = new FormData()
  formData.append("file", new Blob([content]), basename(file))
  if (opts.title) {
    formData.append("title", opts.title)
  }

  const response = await fetch(`${server}/api/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    // Strip control characters from server response before printing
    const safeText = text.replace(/[\x00-\x1f\x7f]/g, "")
    console.error(`Upload failed: ${response.status} ${safeText}`)
    process.exit(1)
  }

  const result = await response.json() as {
    id: string
    url: string
    manageUrl: string
    key: string
  }

  await saveUpload({
    id: result.id,
    key: result.key,
    file: basename(file),
    title: opts.title,
    uploadedAt: new Date().toISOString(),
    url: result.url,
  })

  if (jsonMode) {
    output({
      url: result.url,
      manage: result.manageUrl,
      id: result.id,
    }, true)
  } else {
    console.log("")
    console.log(`  url: ${result.url}`)
    console.log(`  manage: ${result.manageUrl}`)
    console.log("")
    console.log(`Management key saved to ~/.config/bobbin/uploads.json`)
  }
}
