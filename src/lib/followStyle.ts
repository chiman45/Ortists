import type { CSSProperties } from "react";

/** Brand yellow — every Follow button on the site uses it. */
export const FOLLOW_YELLOW = "#FFB800";

/**
 * Style for Follow buttons everywhere:
 *  - Not following: solid yellow with dark text
 *  - Following: soft yellow outline, so it's clearly a different state
 */
export function followStyle(following: boolean): CSSProperties {
  return following
    ? { background: "rgba(255,184,0,0.12)", color: FOLLOW_YELLOW, border: "1px solid rgba(255,184,0,0.45)" }
    : { background: FOLLOW_YELLOW, color: "#050505", border: "1px solid " + FOLLOW_YELLOW };
}
