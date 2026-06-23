/**
 * Editorial background — three huge blurred orbs in the brand violet/cyan
 * palette, drifting on long ease-in-out cycles. Replaces the previous
 * BgParticles (tiny dots) with the depth-and-light language used by the
 * guest-side InsightFlow web survey.
 *
 * Source (CSS): design/iterations/insightflow/uploads/insightflow2.html
 * (`.hero__orbs`, `.orb--a/b/c`, `@keyframes orbA/B/C` — see globals.css).
 *
 * Geometry tuned down ~30% from the web original (480 → 320 px on the
 * largest orb) so the layer reads at 375 px viewports without dominating
 * dashboard content. `fixed inset-0 -z-10 pointer-events-none` puts it
 * behind everything; `aria-hidden` keeps it out of the a11y tree.
 *
 * Honors `prefers-reduced-motion`: keyframes are suppressed in globals.css
 * so the orbs paint in their start position without the drift loop.
 */
export function BgOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <span className="bg-orb bg-orb--a" />
      <span className="bg-orb bg-orb--b" />
      <span className="bg-orb bg-orb--c" />
    </div>
  )
}
