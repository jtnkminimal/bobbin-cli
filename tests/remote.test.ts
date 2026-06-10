import { test } from "node:test"
import assert from "node:assert/strict"
import { isRemote, extractId } from "../src/remote.js"

test("isRemote recognizes full URLs", () => {
  assert.equal(isRemote("https://bobbin.work/r/P2fumq1n"), true)
  assert.equal(isRemote("http://localhost:3000/r/abc"), true)
})

test("isRemote recognizes bare domain URLs", () => {
  assert.equal(isRemote("bobbin.work/r/P2fumq1n"), true)
})

test("isRemote recognizes bare IDs", () => {
  assert.equal(isRemote("P2fumq1n"), true)
})

test("isRemote treats cast files and paths as local", () => {
  assert.equal(isRemote("session.cast"), false)
  assert.equal(isRemote("./recordings/session.cast"), false)
  assert.equal(isRemote("/home/user/session.cast"), false)
})

test("extractId pulls the ID from URLs", () => {
  assert.equal(extractId("https://bobbin.work/r/P2fumq1n"), "P2fumq1n")
  assert.equal(extractId("bobbin.work/r/P2fumq1n"), "P2fumq1n")
  assert.equal(extractId("P2fumq1n"), "P2fumq1n")
})

test("extractId takes the last path segment and strips unsafe characters", () => {
  assert.equal(extractId("abc?key=../../etc"), "etc")
  assert.equal(extractId("P2fumq1n?share=1"), "P2fumq1nshare1")
})

test("extractId rejects inputs with no usable ID", () => {
  assert.throws(() => extractId("https://bobbin.work/r/"), /Invalid recording ID/)
  assert.throws(() => extractId("???/"), /Invalid recording ID/)
})
