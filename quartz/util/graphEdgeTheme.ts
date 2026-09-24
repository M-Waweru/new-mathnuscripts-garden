/**
 * The @quartz-community/graph plugin paints edges using CSS `--lightgray`.
 * In dark mode our `--lightgray` is close to the graph backdrop, so links disappear.
 */
export function resolveGraphEdgeLightgray(
  isDarkMode: boolean,
  colors: { gray: string; lightgray: string },
): string | null {
  if (!isDarkMode) return null
  const gray = colors.gray.trim()
  const lightgray = colors.lightgray.trim()
  if (!gray) return lightgray || "#a9b8d0"
  return gray
}

export function applyGraphEdgeLightgrayOverride(
  root: HTMLElement = document.documentElement,
): void {
  const isDark = root.getAttribute("saved-theme") === "dark"
  if (!isDark) {
    root.style.removeProperty("--lightgray")
    return
  }

  const styles = getComputedStyle(root)
  const override = resolveGraphEdgeLightgray(true, {
    gray: styles.getPropertyValue("--gray"),
    lightgray: styles.getPropertyValue("--lightgray"),
  })
  if (override) root.style.setProperty("--lightgray", override)
}
