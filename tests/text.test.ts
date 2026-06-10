import { test } from "node:test"
import assert from "node:assert/strict"
import { stripAnsi, renderOutput, castToText } from "../src/cast/text.js"
import type { CastFile } from "../src/cast/types.js"

test("strips color codes", () => {
  assert.equal(stripAnsi("\x1b[31mred\x1b[0m plain \x1b[1;32mbold green\x1b[m"), "red plain bold green")
})

test("strips cursor movement and erase sequences", () => {
  assert.equal(stripAnsi("\x1b[2J\x1b[H\x1b[?25lhello\x1b[?25h"), "hello")
  assert.equal(stripAnsi("\x1b[1A\x1b[2Kdone"), "done")
})

test("strips OSC window title sequences", () => {
  assert.equal(stripAnsi("\x1b]0;my title\x07hello"), "hello")
  assert.equal(stripAnsi("\x1b]8;;https://example.com\x1b\\link\x1b]8;;\x1b\\"), "link")
})

test("renderOutput normalizes CRLF", () => {
  assert.equal(renderOutput("line one\r\nline two\r\n"), "line one\nline two\n")
})

test("renderOutput resolves carriage-return overwrites (progress bars)", () => {
  assert.equal(renderOutput("0%\r25%\r100%\ndone\n"), "100%\ndone\n")
  assert.equal(renderOutput("abc\rxy"), "xyc")
})

test("renderOutput applies backspaces", () => {
  assert.equal(renderOutput("abcd\b\b!"), "ab!")
})

test("renderOutput drops remaining control characters", () => {
  assert.equal(renderOutput("a\x00b\x07c"), "abc")
})

test("castToText concatenates output events and ignores input events", () => {
  const cast: CastFile = {
    header: { version: 2, width: 80, height: 24 },
    events: [
      [0.1, "o", "\x1b[32m$ \x1b[0mecho hi\r\n"],
      [0.2, "i", "secret keystroke"],
      [0.3, "o", "hi\r\n"],
    ],
  }
  assert.equal(castToText(cast), "$ echo hi\nhi\n")
})
