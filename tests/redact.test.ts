import { test } from "node:test"
import assert from "node:assert/strict"
import { redactSensitive } from "../src/cast/writer.js"

test("redacts management keys in URLs", () => {
  const input = "https://bobbin.work/r/abc?key=0123456789abcdef0123"
  assert.equal(redactSensitive(input), "https://bobbin.work/r/abc?key=[REDACTED]")
})

test("redacts JSON key fields", () => {
  const input = '{"key":"0123456789abcdef0123"}'
  assert.equal(redactSensitive(input), '{"key":"[REDACTED]"}')
})

test("redacts env var assignments", () => {
  assert.equal(redactSensitive("export API_KEY=sk-abc123"), "export API_KEY=[REDACTED]")
  assert.equal(redactSensitive("PASSWORD=hunter2"), "PASSWORD=[REDACTED]")
  assert.equal(redactSensitive("MY_TOKEN=t0k3n"), "MY_TOKEN=[REDACTED]")
})

test("redacts AWS access keys", () => {
  assert.equal(redactSensitive("AKIAIOSFODNN7EXAMPLE"), "AKIA[REDACTED]")
})

test("redacts bearer tokens", () => {
  const input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  assert.equal(redactSensitive(input), "Authorization: Bearer [REDACTED]")
})

test("redacts GitHub tokens", () => {
  assert.equal(
    redactSensitive("ghp_abcdefghijklmnopqrstuvwxyz0123456789"),
    "ghp_[REDACTED]"
  )
  assert.equal(
    redactSensitive("github_pat_abcdefghijklmnopqrstuv"),
    "github_pat_[REDACTED]"
  )
})

test("redacts basic auth passwords but keeps the host", () => {
  assert.equal(
    redactSensitive("https://user:s3cret@example.com/path"),
    "https://user:[REDACTED]@example.com/path"
  )
})

test("redacts connection string passwords but keeps the host", () => {
  assert.equal(
    redactSensitive("postgres://admin:s3cret@db.internal:5432/app"),
    "postgres://admin:[REDACTED]@db.internal:5432/app"
  )
  assert.equal(
    redactSensitive("mongodb://root:hunter2@mongo/db"),
    "mongodb://root:[REDACTED]@mongo/db"
  )
})

test("redacts private key blocks but keeps the END marker", () => {
  const input =
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEow\nsecretlines\n-----END RSA PRIVATE KEY-----"
  assert.equal(
    redactSensitive(input),
    "-----BEGIN RSA PRIVATE KEY-----[REDACTED]-----END RSA PRIVATE KEY-----"
  )
})

test("leaves ordinary output untouched", () => {
  const input = "npm test\n42 passing (1.2s)\nhttps://example.com:8080/path"
  assert.equal(redactSensitive(input), input)
})
