export default function RouteLoading() {
  return (
    <section className="route-loading" role="status" aria-live="polite" aria-busy="true">
      <p>Preparando seu espaço de estudo…</p>
      <div aria-hidden="true"><span /><span /><span /></div>
    </section>
  )
}
