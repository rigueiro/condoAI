"use client";

import { THEME_STORAGE_KEY } from "./theme-context";

/**
 * Inline script executed before React hydrates so the correct theme is
 * applied on first paint and we avoid a light/dark flash on reload.
 */
const SCRIPT = `(function () {
  try {
    var stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    var resolved;
    if (stored === "light" || stored === "dark") {
      resolved = stored;
    } else {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
  } catch (_) {}
})();`;

export function ThemeScript() {
  return (
    <script
      // The script needs to run before React paints, hence inline injection.
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
