'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Bookmark, FileText, Lock, Search, ShieldAlert, Trash2, Unlock, Users } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Avatar, EmptyState, ListSkeleton, PageHeader, Spinner } from '@/components/ui/bits'
import { downloadCsv } from '@/components/portal/ExportCsv'
import { CandidateFiles } from '@/components/portal/CandidateFiles'
import { AVAILABILITY, ENGLISH, TALUKS } from '@/lib/constants'
import { cn, formatDate, formatINR, timeAgo } from '@/lib/format'

type Row = {
  id: string; display_name: string; current_title: string | null; experience_years: number | null; education: string | null; taluk: string | null; location: string | null
  skills: string[]; languages: string[]; expected_salary: number | null; availability: keyof typeof AVAILABILITY | null; preferred_categories: string[]; english_level: keyof typeof ENGLISH | null
  has_resume: boolean; verified_docs: number; last_active_at: string; unlocked: boolean; total_count: number
}
type Filters = { q: string; taluk: string; category: string; min_exp: string; max_exp: string; availability: string; english: string; active: string; unlocked: string }
const EMPTY: Filters = { q: '', taluk: '', category: '', min_exp: '', max_exp: '', availability: '', english: '', active: '', unlocked: '' }
const PER = 20

export function TalentSearch({ employerId, verified, initialCredits, categories, savedSearches }: { employerId: string; verified: boolean; initialCredits: number; categories: string[]; savedSearches: { id: string; name: string; filters: Record<string, string> }[] }) {
  const toast = useToast()
  const router = useRouter()
  const qc = useQueryClient()
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(0)
  const [credits, setCredits] = useState(initialCredits)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saveName, setSaveName] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const key = ['talent', filters, page]
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: key,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const n = (v: string) => (v === '' ? null : Number(v))
      const { data, error } = await getSupabase().rpc('search_talent_v2', {
        p_query: filters.q || null,
        p_taluk: filters.taluk || null,
        p_min_exp: n(filters.min_exp),
        p_max_exp: n(filters.max_exp),
        p_availability: filters.availability || null,
        p_category: filters.category || null,
        p_english: filters.english || null,
        p_unlocked_only: filters.unlocked === '1',
        p_active_days: n(filters.active),
        p_limit: PER,
        p_offset: page * PER,
      })
      if (error) throw error
      return (data ?? []) as Row[]
    },
  })
  const rows = data ?? []
  const total = rows[0]?.total_count ?? 0

  const apply = (f: Filters = draft) => {
    setFilters(f)
    setPage(0)
    setSelected(new Set())
  }

  const unlock = async (id: string) => {
    if (!verified) return toast('Your company must be verified before unlocking candidates.', 'error')
    if (credits < 1) {
      toast('No unlock credits left. Buy a plan to unlock more candidates.', 'error')
      router.push('/employer/billing')
      return
    }
    setUnlocking(id)
    const { error } = await getSupabase().rpc('unlock_candidate', { p_candidate: id })
    setUnlocking(null)
    if (error) return toast(error.message, 'error')
    setCredits((c) => c - 1)
    toast('Profile unlocked. Contact details are now visible.')
    qc.invalidateQueries({ queryKey: ['talent'] })
    qc.invalidateQueries({ queryKey: ['candidate-card', id] })
  }

  const saveSearch = async () => {
    if (!saveName.trim()) return
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    const { error } = await getSupabase().from('saved_searches').insert({ employer_id: employerId, name: saveName.trim(), filters: clean })
    if (error) return toast(error.message, 'error')
    setSaveOpen(false)
    setSaveName('')
    toast('Search saved')
    router.refresh()
  }

  const deleteSearch = async (id: string) => {
    await getSupabase().from('saved_searches').delete().eq('id', id)
    router.refresh()
  }

  const exportSelected = async () => {
    const ids = rows.filter((r) => r.unlocked && (selected.size === 0 || selected.has(r.id))).map((r) => r.id)
    if (!ids.length) return toast('Unlock candidates before exporting them', 'error')
    const sb = getSupabase()
    const cards = await Promise.all(ids.map((id) => sb.rpc('candidate_card', { p_candidate: id }).then((r) => r.data as Record<string, unknown> | null)))
    downloadCsv(
      cards.filter(Boolean).map((c) => ({
        Name: c!.full_name, Phone: c!.phone, Email: c!.email, Role: c!.headline, 'Experience (yrs)': c!.experience_years, Education: c!.education,
        Location: [c!.location, c!.taluk].filter(Boolean).join(', '), 'Expected salary': c!.expected_salary, Skills: ((c!.skills as string[]) ?? []).join('; '),
      })),
      'candidates',
    )
    await sb.rpc('mark_unlocks_downloaded', { p_ids: ids })
  }

  const fld = (k: keyof Filters) => ({ value: draft[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value }) })

  return (
    <>
      <PageHeader
        title="Candidate database"
        description="People in Kolar district who are open to work. Contact details unlock with credits."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
            <Unlock size={15} className="text-navy-600" /> <span className="font-semibold tabular-nums">{credits}</span> unlock credits
            <Link href="/employer/billing" className="ml-1 text-[13px] link">Buy</Link>
          </div>
        }
      />
      {!verified && (
        <div className="mb-5 flex gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>You can search and preview profiles now. Unlocking contact details needs a verified company. <Link href="/employer/company" className="font-medium underline">Complete your company profile</Link>.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); apply() }} className="card grid gap-4 p-4">
            <div className="field">
              <label className="label" htmlFor="t-q">Keyword</label>
              <div className="relative">
                <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-4" />
                <input id="t-q" className="input pl-9" placeholder="Role, skill, education" {...fld('q')} />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="t-cat">Preferred category</label>
              <select id="t-cat" className="input" {...fld('category')}>
                <option value="">Any</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="t-taluk">Taluk</label>
              <select id="t-taluk" className="input" {...fld('taluk')}>
                <option value="">All taluks</option>
                {TALUKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="field">
                <label className="label" htmlFor="t-min">Min exp</label>
                <input id="t-min" type="number" min={0} max={50} className="input" placeholder="0" {...fld('min_exp')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="t-max">Max exp</label>
                <input id="t-max" type="number" min={0} max={50} className="input" placeholder="Any" {...fld('max_exp')} />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="t-av">Can join</label>
              <select id="t-av" className="input" {...fld('availability')}>
                <option value="">Any time</option>
                {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="t-en">English (at least)</label>
              <select id="t-en" className="input" {...fld('english')}>
                <option value="">Any</option>
                <option value="basic">Basic</option>
                <option value="good">Good</option>
                <option value="fluent">Fluent</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="t-act">Active in</label>
              <select id="t-act" className="input" {...fld('active')}>
                <option value="">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.unlocked === '1'} onChange={(e) => setDraft({ ...draft, unlocked: e.target.checked ? '1' : '' })} className="size-4 accent-[var(--color-navy-600)]" /> Only unlocked / applicants
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setDraft(EMPTY); apply(EMPTY) }} className="btn btn-outline">Reset</button>
              <button className="btn btn-navy">Search</button>
            </div>
          </form>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Saved searches</p>
              <button onClick={() => setSaveOpen(true)} className="text-[13px] link">Save current</button>
            </div>
            {savedSearches.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">Save filters you use often.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {savedSearches.map((s) => (
                  <li key={s.id} className="flex items-center gap-1">
                    <button onClick={() => { const f = { ...EMPTY, ...s.filters }; setDraft(f); apply(f) }} className="flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-canvas">
                      <Bookmark size={14} className="shrink-0 text-ink-4" /> <span className="truncate">{s.name}</span>
                    </button>
                    <button onClick={() => deleteSearch(s.id)} className="rounded p-1.5 text-ink-4 hover:text-brand-700" aria-label={`Delete ${s.name}`}><Trash2 size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-2">
              {isLoading ? 'Searching…' : <><span className="font-semibold text-ink">{total.toLocaleString('en-IN')}</span> candidate{total === 1 ? '' : 's'}</>}
              {isFetching && !isLoading && <Spinner size={13} className="ml-2 inline text-ink-3" />}
            </p>
            <button onClick={exportSelected} className="btn btn-outline btn-sm" disabled={!rows.some((r) => r.unlocked)}>
              Export unlocked {selected.size ? `(${selected.size})` : ''} to CSV
            </button>
          </div>
          <div className="card">
            {error ? (
              <EmptyState title="Search unavailable" body={(error as Error).message} />
            ) : isLoading ? (
              <ListSkeleton rows={6} />
            ) : rows.length === 0 ? (
              <EmptyState icon={<Users size={20} />} title="No candidates match" body="Remove a filter or try a broader keyword." />
            ) : (
              <ul className="divide-y divide-line-2">
                {rows.map((r) => (
                  <li key={r.id} className="flex gap-3 px-4 py-4 sm:px-5">
                    {r.unlocked && (
                      <input type="checkbox" aria-label={`Select ${r.display_name}`} checked={selected.has(r.id)} onChange={(e) => { const s = new Set(selected); if (e.target.checked) s.add(r.id); else s.delete(r.id); setSelected(s) }} className="mt-3 size-4 shrink-0 accent-[var(--color-navy-600)]" />
                    )}
                    <Avatar name={r.display_name} size={44} />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setPreview(r.id)} className="text-left font-semibold hover:underline">{r.display_name}</button>
                      <p className="text-sm text-ink-2">{r.current_title ?? 'Open to work'}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-3">
                        <span>{r.experience_years ? `${r.experience_years} yrs exp` : 'Fresher'}</span>
                        {r.education && <span>{r.education}</span>}
                        {(r.location || r.taluk) && <span>{[r.location, r.taluk].filter(Boolean).join(', ')}</span>}
                        {r.expected_salary && <span>Expects {formatINR(r.expected_salary)}/mo</span>}
                        {r.availability && <span>Joins {AVAILABILITY[r.availability].toLowerCase()}</span>}
                      </p>
                      {r.skills?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.skills.slice(0, 6).map((s) => <span key={s} className="chip h-5 text-[11px]">{s}</span>)}
                        </div>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-4">
                        <span>Active {timeAgo(r.last_active_at)}</span>
                        {r.has_resume && <span className="flex items-center gap-1"><FileText size={12} /> Resume</span>}
                        {r.verified_docs > 0 && <span className="flex items-center gap-1 text-emerald-700"><BadgeCheck size={12} /> {r.verified_docs} verified doc{r.verified_docs > 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {r.unlocked ? (
                        <button onClick={() => setPreview(r.id)} className="btn btn-outline btn-sm"><Unlock size={14} /> <span className="hidden sm:inline">View contact</span></button>
                      ) : (
                        <button onClick={() => unlock(r.id)} disabled={unlocking === r.id} className="btn btn-navy btn-sm">
                          {unlocking === r.id ? <Spinner size={14} /> : <><Lock size={14} /> <span className="hidden sm:inline">Unlock · 1 credit</span></>}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {total > PER && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-sm text-ink-3">Page {page + 1} of {Math.ceil(total / PER)}</span>
              <button className="btn btn-outline btn-sm" disabled={(page + 1) * PER >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </section>
      </div>

      <CandidatePreview id={preview} onClose={() => setPreview(null)} onUnlock={unlock} unlocking={unlocking} />

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} size="sm" title="Save this search" footer={<><button onClick={() => setSaveOpen(false)} className="btn btn-outline">Cancel</button><button onClick={saveSearch} className="btn btn-navy" disabled={!saveName.trim()}>Save</button></>}>
        <div className="field">
          <label className="label" htmlFor="ss-name">Name</label>
          <input id="ss-name" className="input" value={saveName} maxLength={80} placeholder="e.g. Machine operators in Malur" onChange={(e) => setSaveName(e.target.value)} />
        </div>
      </Modal>
    </>
  )
}

type Card = {
  id: string; full_name: string; email: string | null; phone: string | null; headline: string | null; bio: string | null; skills: string[]; languages: string[]
  experience_years: number | null; education: string | null; expected_salary: number | null; availability: keyof typeof AVAILABILITY | null; taluk: string | null; location: string | null
  resume_path: string | null; unlocked: boolean
  experiences: { id: string; title: string; company: string; start_date: string; end_date: string | null; is_current: boolean }[]
  documents: { id: string; kind: string; file_name: string; file_path: string; status: string }[]
}

function CandidatePreview({ id, onClose, onUnlock, unlocking }: { id: string | null; onClose: () => void; onUnlock: (id: string) => void; unlocking: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['candidate-card', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc('candidate_card', { p_candidate: id })
      if (error) throw error
      return data as Card
    },
  })
  return (
    <Modal open={Boolean(id)} onClose={onClose} size="lg" title={data?.full_name ?? 'Candidate'} description={data?.headline ?? undefined}
      footer={data && !data.unlocked ? <button onClick={() => onUnlock(data.id)} className="btn btn-navy" disabled={unlocking === data.id}>{unlocking === data.id ? <Spinner /> : <><Lock size={15} /> Unlock contact · 1 credit</>}</button> : <button onClick={onClose} className="btn btn-outline">Close</button>}>
      {isLoading || !data ? (
        <div className="flex justify-center py-10"><Spinner className="text-ink-3" /></div>
      ) : (
        <div className="grid gap-5">
          <div className={cn('grid gap-2 rounded-lg p-4 text-sm sm:grid-cols-2', data.unlocked ? 'bg-emerald-50 text-emerald-900' : 'bg-canvas text-ink-3')}>
            <p><span className="block text-xs opacity-75">Phone</span>{data.unlocked ? <a href={`tel:${data.phone}`} className="font-semibold">{data.phone ?? '—'}</a> : '•••••• ••••'}</p>
            <p><span className="block text-xs opacity-75">Email</span>{data.unlocked ? <a href={`mailto:${data.email}`} className="font-semibold break-all">{data.email ?? '—'}</a> : '••••@•••••'}</p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-ink-3">Experience</dt><dd className="font-medium">{data.experience_years ? `${data.experience_years} years` : 'Fresher'}</dd></div>
            <div><dt className="text-xs text-ink-3">Education</dt><dd className="font-medium">{data.education ?? '—'}</dd></div>
            <div><dt className="text-xs text-ink-3">Location</dt><dd className="font-medium">{[data.location, data.taluk].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt className="text-xs text-ink-3">Expected salary</dt><dd className="font-medium">{data.expected_salary ? `${formatINR(data.expected_salary)}/mo` : '—'}</dd></div>
            <div><dt className="text-xs text-ink-3">Can join</dt><dd className="font-medium">{data.availability ? AVAILABILITY[data.availability] : '—'}</dd></div>
            <div><dt className="text-xs text-ink-3">Languages</dt><dd className="font-medium">{data.languages?.join(', ') || '—'}</dd></div>
          </dl>
          {data.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{data.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
          {data.bio && <p className="text-sm whitespace-pre-line text-ink-2">{data.bio}</p>}
          {data.experiences?.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Work history</p>
              <ul className="mt-2 space-y-2 text-sm">
                {data.experiences.map((x) => <li key={x.id}><span className="font-medium">{x.title}</span> · {x.company} <span className="text-ink-3">({formatDate(x.start_date)} – {x.is_current ? 'Present' : formatDate(x.end_date)})</span></li>)}
              </ul>
            </div>
          )}
          {data.unlocked && <CandidateFiles resumePath={data.resume_path} documents={data.documents ?? []} />}
        </div>
      )}
    </Modal>
  )
}
