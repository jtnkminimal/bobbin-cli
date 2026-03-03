export function output(data: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(data))
  } else if (typeof data === "string") {
    console.log(data)
  } else {
    const obj = data as Record<string, unknown>
    for (const [key, value] of Object.entries(obj)) {
      console.log(`  ${key}: ${value}`)
    }
  }
}

export function info(message: string, jsonMode: boolean): void {
  if (!jsonMode) {
    console.error(message)
  }
}
