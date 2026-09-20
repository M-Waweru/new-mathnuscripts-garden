/** Dollar amounts like $150K, $175,000, $1M — not LaTeX math. */
const CURRENCY_DOLLAR = /\$(\d[\d,]*(?:\.\d+)?[KMBkmb]?)(?=[^\w]|$)/g

function escapeCurrencyInMarkdown(src) {
  const segments = src.split(/(```[\s\S]*?```)/g)
  return segments
    .map((segment, index) => {
      if (index % 2 === 1) return segment
      return segment.replace(CURRENCY_DOLLAR, (_match, amount) => `\\$${amount}`)
    })
    .join("")
}

export const PreserveDollarText = () => ({
  name: "PreserveDollarText",
  textTransform(_ctx, src) {
    return escapeCurrencyInMarkdown(src)
  },
})

export default PreserveDollarText
