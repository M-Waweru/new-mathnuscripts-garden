import test from "node:test"
import assert from "node:assert/strict"
import { resolveGraphEdgeLightgray } from "./graphEdgeTheme"

test("resolveGraphEdgeLightgray uses gray in dark mode for visible edges", () => {
  assert.equal(
    resolveGraphEdgeLightgray(true, { gray: "#a9b8d0", lightgray: "#3a465a" }),
    "#a9b8d0",
  )
})

test("resolveGraphEdgeLightgray leaves light mode unchanged", () => {
  assert.equal(resolveGraphEdgeLightgray(false, { gray: "#66758f", lightgray: "#d7deea" }), null)
})
