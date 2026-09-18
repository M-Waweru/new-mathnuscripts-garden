import test from "node:test"
import assert from "node:assert/strict"
import PreserveDollarText from "../../plugins/preserve-dollar-text/index.js"

test("PreserveDollarText escapes currency amounts before math parsing", () => {
  const plugin = PreserveDollarText()
  const input =
    "Raised $150K and later $50K. Already escaped \\$1M stays. Code:\n\n```md\n$250\n```\n"
  const output = plugin.textTransform({}, input)

  assert.match(output, /\\\$150K/)
  assert.match(output, /\\\$50K/)
  assert.match(output, /\\\$1M stays/)
  assert.match(output, /```md\n\$250\n```/)
})
