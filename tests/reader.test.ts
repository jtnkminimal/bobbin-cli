import { test } from "node:test"
import assert from "node:assert/strict"
import { parseCastString } from "../src/cast/reader.js"

const HEADER = '{"version":2,"width":80,"height":24}'

test("parses a header and events", () => {
  const cast = parseCastString(`${HEADER}\n[0.1,"o","hello"]\n[0.2,"o","world"]`)
  assert.equal(cast.header.width, 80)
  assert.equal(cast.events.length, 2)
  assert.deepEqual(cast.events[0], [0.1, "o", "hello"])
})

test("parses a header with no events", () => {
  const cast = parseCastString(HEADER)
  assert.equal(cast.events.length, 0)
})

test("skips blank lines between events", () => {
  const cast = parseCastString(`${HEADER}\n[0.1,"o","a"]\n\n[0.2,"o","b"]\n`)
  assert.equal(cast.events.length, 2)
})

test("preserves bobbin metadata", () => {
  const header = '{"version":2,"width":80,"height":24,"bobbin":{"version":"0.3.0","command":"npm test","exit_code":1}}'
  const cast = parseCastString(`${header}\n[0.1,"o","x"]`)
  assert.equal(cast.header.bobbin?.command, "npm test")
  assert.equal(cast.header.bobbin?.exit_code, 1)
})

test("rejects empty input", () => {
  assert.throws(() => parseCastString(""), /Empty cast file|JSON/)
})

test("rejects unsupported versions", () => {
  assert.throws(
    () => parseCastString('{"version":1,"width":80,"height":24}'),
    /Unsupported asciicast version: 1/
  )
})

test("rejects malformed JSON", () => {
  assert.throws(() => parseCastString("not json"), SyntaxError)
})
