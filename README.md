# bobbin

Agent-first terminal recording. Capture, replay, and share terminal sessions.

Built for AI agents and humans alike — every command supports `--json` for machine-readable output.

<p align="center">
  <a href="https://bobbin.work/r/MGzXEWny">
    <img src="demo.gif" alt="bobbin demo recording">
  </a>
</p>

## Install

```bash
npm install -g @bobbin/cli
```

Or run directly with npx:

```bash
npx @bobbin/cli rec
```

For PTY-based recording (better fidelity), also install the optional dependency:

```bash
npm install -g node-pty
```

If `node-pty` is not available, bobbin falls back to the Unix `script` command automatically.

## Quick start

```bash
# Record an interactive session
bobbin rec

# Record a specific command
bobbin rec -- npm test

# Play it back
bobbin play ~/.config/bobbin/recordings/bobbin-1709472000000.cast

# Play a shared recording by URL or ID
bobbin play https://bobbin.work/r/P2fumq1n
bobbin play bobbin.work/r/P2fumq1n
bobbin play P2fumq1n

# Upload and share
bobbin upload ~/.config/bobbin/recordings/bobbin-1709472000000.cast

# List your recordings
bobbin ls
```

## Commands

### `bobbin rec [command...]`

Record a terminal session. Without a command, starts an interactive shell — type `exit` to stop.

```bash
bobbin rec                          # interactive session
bobbin rec -- make build            # record a specific command
bobbin rec -o my-session.cast       # custom output path
bobbin rec -t "deploy fix" -- ./deploy.sh
```

| Flag | Description |
|------|-------------|
| `-o, --output <file>` | Output file path (default: `~/.config/bobbin/recordings/bobbin-<timestamp>.cast`) |
| `-t, --title <title>` | Recording title stored in metadata |
| `--json` | JSON output for agent consumption |

Recordings are saved in [asciicast v2](https://docs.asciinema.org/manual/asciicast/v2/) format with additional `bobbin` metadata including git context (branch, SHA, repo).

### `bobbin play <file | url | id>`

Play back a recording in the terminal with real timing. Accepts a local file, a bobbin.work URL, or a bare recording ID.

```bash
# Local file
bobbin play session.cast
bobbin play session.cast -s 3       # 3x speed

# Remote — all equivalent
bobbin play P2fumq1n
bobbin play bobbin.work/r/P2fumq1n
bobbin play https://bobbin.work/r/P2fumq1n
```

When given a URL or ID, bobbin fetches the recording from the server, plays it, and cleans up the temporary file automatically.

| Flag | Description |
|------|-------------|
| `-s, --speed <n>` | Playback speed multiplier (default: `1`) |
| `--server <url>` | Server URL for remote playback (default: `https://bobbin.work`) |
| `--json` | JSON output |

### `bobbin upload <file>`

Upload a recording to a bobbin server and get a shareable URL.

```bash
bobbin upload session.cast
bobbin upload session.cast -t "CI failure repro"
bobbin upload session.cast --server https://my-server.com
```

| Flag | Description |
|------|-------------|
| `-t, --title <title>` | Title for the shared recording |
| `--server <url>` | Server URL (default: `https://bobbin.work` or `BOBBIN_SERVER` env var) |
| `--json` | JSON output |

Returns a shareable URL and a management URL. The management key is saved locally to `~/.config/bobbin/uploads.json`.

### `bobbin download <id | url>`

Download a recording from a bobbin server.

```bash
bobbin download P2fumq1n
bobbin download https://bobbin.work/r/P2fumq1n
bobbin download P2fumq1n -o recording.cast
```

| Flag | Description |
|------|-------------|
| `-o, --output <file>` | Output file path (default: `<id>.cast` in current directory) |
| `--server <url>` | Server URL |
| `--json` | JSON output |

### `bobbin ls`

List recordings.

```bash
bobbin ls               # local recordings
bobbin ls --remote      # uploaded recordings
```

| Flag | Description |
|------|-------------|
| `--remote` | List uploaded recordings instead of local ones |
| `--json` | JSON output |

## Agent usage

Every command supports `--json` for structured output. Info messages go to stderr, data goes to stdout as JSON.

```bash
# Record and capture result
result=$(bobbin rec --json -- npm test)
echo "$result" | jq '.duration'

# Upload and get URL
url=$(bobbin upload --json session.cast | jq -r '.url')

# Play a shared recording
bobbin play P2fumq1n

# List recordings as JSON array
bobbin ls --json | jq '.[].file'
```

### Agent integration example

An AI agent can record its own terminal sessions and share them:

```bash
# Agent records a debugging session
bobbin rec --json -t "investigating OOM" -- ./debug.sh
# => {"status":"complete","file":"/home/user/.config/bobbin/recordings/bobbin-1709472000000.cast","duration":12.3,"exitCode":0}

# Agent uploads and gets a shareable link
bobbin upload --json /home/user/.config/bobbin/recordings/bobbin-1709472000000.cast
# => {"url":"https://bobbin.work/r/P2fumq1n","manage":"https://bobbin.work/r/P2fumq1n?key=...","id":"P2fumq1n"}

# Another agent or human plays it back
bobbin play P2fumq1n
```

## Configuration

| Item | Location |
|------|----------|
| Recordings | `~/.config/bobbin/recordings/` |
| Upload metadata | `~/.config/bobbin/uploads.json` |

### Environment variables

| Variable | Description |
|----------|-------------|
| `BOBBIN_SERVER` | Default server URL (overrides `https://bobbin.work`) |
| `SHELL` | Shell used for interactive recording (default: `/bin/bash`) |

## Recording format

Bobbin uses [asciicast v2](https://docs.asciinema.org/manual/asciicast/v2/) with an extended header:

```json
{
  "version": 2,
  "width": 120,
  "height": 40,
  "timestamp": 1709472000,
  "bobbin": {
    "version": "0.1.0",
    "command": "npm test",
    "git_repo": "user/project",
    "git_branch": "main",
    "git_sha": "a1b2c3d"
  }
}
```

Recordings are compatible with [asciinema](https://asciinema.org/) and any tool that reads asciicast v2.

## Recording backends

Bobbin supports two recording backends:

| Backend | When used | Fidelity |
|---------|-----------|----------|
| **PTY** (`node-pty`) | When `node-pty` is installed | Full terminal emulation — colors, cursor movement, resize events |
| **script** | Fallback when `node-pty` is unavailable | Uses the Unix `script` command — good enough for most use cases |

The backend is detected automatically. No configuration needed.

## Security

### Automatic credential redaction

Bobbin automatically redacts common credential patterns from recordings before they're written to disk:

- Management keys in URLs (`?key=...`)
- JSON key/secret fields
- Environment variable patterns (`TOKEN=...`, `SECRET=...`, `PASSWORD=...`, `API_KEY=...`)
- AWS access keys (`AKIA...`)
- Bearer tokens
- GitHub tokens (`ghp_`, `gho_`, `ghs_`, `github_pat_`)
- Basic auth in URLs (`https://user:pass@host`)
- Private key blocks (`-----BEGIN PRIVATE KEY-----`)
- Database connection strings with passwords

**Redaction is best-effort.** Always review recordings before sharing, especially if your session involved credentials, API keys, or private data.

### File permissions

All files bobbin creates are locked down:

| Path | Mode | Description |
|------|------|-------------|
| `~/.config/bobbin/` | `0700` | Config directory — owner only |
| `~/.config/bobbin/recordings/*.cast` | `0600` | Recording files — owner read/write only |
| `~/.config/bobbin/uploads.json` | `0600` | Upload metadata with management keys |
| Temporary files during playback | `0600` | Cleaned up after use |

### What gets recorded

A recording captures all terminal **output** from the session. This may include:

- Command output and error messages
- File contents displayed with `cat`, `less`, etc.
- Environment variables if printed
- Anything visible in the terminal

It does **not** capture stdin (keystrokes) — only the output side.

### What does NOT go into recordings

- Your current working directory
- Your environment variables (beyond what appears in terminal output)
- Files outside the terminal session

### Download/playback limits

Remote recordings are capped at 10 MB to prevent abuse. Both the `download` and `play` commands enforce this limit.

### Server validation

All commands that contact a server validate the URL scheme (`https://` or `http://`). HTTP connections produce a warning. The server URL cannot be manipulated via recording IDs — IDs are sanitized to `[a-zA-Z0-9_-]` only.

## Requirements

- Node.js 18+
- Linux or macOS
- Optional: `node-pty` for higher-fidelity recording
