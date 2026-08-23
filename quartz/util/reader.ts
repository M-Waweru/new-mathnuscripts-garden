export type EssayReaderSource = {
  slug?: string
  filePath?: string
  relativePath?: string
  frontmatter?: {
    title?: string
    readerOrder?: number
  }
}

export type EssayReaderEntry = {
  slug: string
  title: string
}

export function buildEssayReaderIndex(files: EssayReaderSource[]): EssayReaderEntry[] {
  return files
    .filter((file) => {
      const filePath = file.relativePath ?? file.filePath ?? ""
      const slug = file.slug ?? ""
      return (
        filePath.startsWith("Content/Essays/") &&
        slug !== "content/essays/index-of-essays" &&
        !slug.endsWith("/index-of-essays")
      )
    })
    .map((file) => ({
      slug: file.slug!,
      title: file.frontmatter?.title ?? file.slug!.split("/").at(-1) ?? "Untitled essay",
      readerOrder: file.frontmatter?.readerOrder,
    }))
    .sort((a, b) => {
      if (a.readerOrder !== undefined || b.readerOrder !== undefined) {
        const orderA = a.readerOrder ?? Number.POSITIVE_INFINITY
        const orderB = b.readerOrder ?? Number.POSITIVE_INFINITY
        if (orderA !== orderB) return orderA - orderB
      }
      return a.title.localeCompare(b.title)
    })
    .map(({ slug, title }) => ({ slug, title }))
}
