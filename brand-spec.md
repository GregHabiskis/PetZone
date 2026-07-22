# PetZone brand binding

PetZone uses warm cream and white surfaces, deep teal structure, joyful cyan highlights, and tightly rationed orange commerce accents with soft geometric UI typography and native Bangla support.

```css
:root {
  --bg: oklch(98.4% 0.018 77.5); /* #FFF9F1 */
  --surface: oklch(100% 0 0); /* #FFFFFF */
  --fg: oklch(24.8% 0.024 207.8); /* #17242A */
  --muted: oklch(50.7% 0.025 206.2); /* #5C6B70 */
  --border: oklch(90.5% 0.016 205.7); /* #DCE5E7 */
  --accent: oklch(40.1% 0.074 211.2); /* #105565 */
}
```

- Display/UI: `"Plus Jakarta Sans", "Avenir Next", "Segoe UI", Arial, sans-serif`
- Bangla/body fallback: `"Noto Sans Bengali", "Hind Siliguri", sans-serif`
- Mono/numerals: `"JetBrains Mono", "SFMono-Regular", Consolas, monospace`

## Observed posture

1. Cream/white dominates; full-page dark surfaces are avoided.
2. Deep teal carries navigation, primary actions, and clinical trust.
3. Cyan is a joyful highlight; orange is reserved for commerce and promotions.
4. Cards use borders before restrained teal-tinted shadows with 14–22 px radii.
5. Product discovery starts with pet and need; search remains prominent at every breakpoint.
