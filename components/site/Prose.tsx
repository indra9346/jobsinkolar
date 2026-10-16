export function ProsePage({ title, updated, intro, children }: { title: string; updated?: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {updated && <p className="mt-2 text-sm text-ink-3">Last updated {updated}</p>}
        {intro && <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{intro}</p>}
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  )
}
