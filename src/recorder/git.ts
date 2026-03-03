import { execSync } from "node:child_process"

export function getGitContext(): { branch?: string; sha?: string; repo?: string } {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: ["pipe", "pipe", "pipe"],
    }).toString().trim()

    const sha = execSync("git rev-parse --short HEAD", {
      stdio: ["pipe", "pipe", "pipe"],
    }).toString().trim()

    let repo: string | undefined
    try {
      const remoteUrl = execSync("git remote get-url origin", {
        stdio: ["pipe", "pipe", "pipe"],
      }).toString().trim()
      // Extract repo name from git@...:user/repo.git or https://.../user/repo.git
      const match = remoteUrl.match(/[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/)
      if (match) repo = match[1]
    } catch {
      // No remote, fall back to directory name
      const toplevel = execSync("git rev-parse --show-toplevel", {
        stdio: ["pipe", "pipe", "pipe"],
      }).toString().trim()
      repo = toplevel.split("/").pop()
    }

    return { branch, sha, repo }
  } catch {
    return {}
  }
}
