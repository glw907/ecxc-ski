/**
 * Per-module entrance-cascade delay, as an inline `--rise` custom property.
 *
 * The page resolves as one top-to-bottom cascade: each module rises in on its
 * own delay, a tight `0.16 + index * 0.04s` step so the stack reads as a single
 * wave (see docs/design-language.md → Motion). Used by the Svelte route wrappers
 * (`.post-module`, `.contact-module`, `.tags-list`) on trusted markup. The markdown
 * pipeline no longer uses this: the engine stamps a `data-rise` ordinal on each
 * rendered module and the `[slug]` page CSS maps it to the same step, so editor
 * HTML carries no inline style. Paired with the `module-rise` keyframes in app.css.
 */
export function riseStyle(idx: number): string {
  return `--rise:${(0.16 + idx * 0.04).toFixed(2)}s`;
}
