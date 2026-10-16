'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarClock, Mail, MessageCircle, Phone } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Spinner } from '@/components/ui/bits'
import { INTERVIEW_MODE } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import type { Application, AppStatus } from '@/lib/types'

type A = Pick<Application, 'id' | 'status' | 'interview_at' | 'interview_mode' | 'interview_location' | 'interview_note'>

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function ApplicationControls({ app, phone, email, name, jobTitle, company }: { app: A; phone: string | null; email: string | null; name: string; jobTitle: string; company: string }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [iv, setIv] = useState(false)
  const [form, setForm] = useState({
    at: toLocalInput(app.interview_at),
    mode: app.interview_mode ?? 'in_person',
    location: app.interview_location ?? '',
    note: app.interview_note ?? '',
  })

  const update = async (patch: Partial<Application>, msg: string, key: string) => {
    setBusy(key)
    const { error } = await getSupabase().from('applications').update(patch).eq('id', app.id)
    setBusy(null)
    if (error) return toast(error.message, 'error')
    toast(msg)
    router.refresh()
  }

  const move = (status: AppStatus, msg: string) => update({ status }, msg, status)

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.at) return toast('Choose a date and time', 'error')
    const when = new Date(form.at)
    if (when.getTime() < Date.now() - 60000) return toast('Interview time must be in the future', 'error')
    if (form.mode !== 'phone' && form.location.trim().length < 3) return toast(form.mode === 'video' ? 'Add the meeting link' : 'Add the interview address', 'error')
    await update(
      { status: 'interview', interview_at: when.toISOString(), interview_mode: form.mode as A['interview_mode'], interview_location: form.location.trim() || null, interview_note: form.note.trim() || null },
      app.status === 'interview' ? 'Interview rescheduled. The candidate has been notified.' : 'Interview scheduled. The candidate has been notified.',
      'interview',
    )
    setIv(false)
  }

  const s = app.status
  const closed = s === 'hired' || s === 'withdrawn'
  const wa = phone ? `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${name.split(' ')[0]}, this is ${company} regarding your application for ${jobTitle} on Jobs in Kolar.`)}` : null

  const Btn = ({ k, onClick, children, variant = 'btn-outline' }: { k: string; onClick: () => void; children: React.ReactNode; variant?: string }) => (
    <button onClick={onClick} disabled={!!busy} className={`btn ${variant} w-full`}>
      {busy === k ? <Spinner /> : children}
    </button>
  )

  return (
    <>
      <section className="card p-5">
        <p className="font-semibold">Next step</p>
        {s === 'interview' && app.interview_at && (
          <div className="mt-3 rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
            <p className="flex items-center gap-1.5 font-medium"><CalendarClock size={15} /> {formatDate(app.interview_at, true)}</p>
            <p className="mt-0.5">{app.interview_mode ? INTERVIEW_MODE[app.interview_mode] : ''}{app.interview_location ? ` · ${app.interview_location}` : ''}</p>
          </div>
        )}
        <div className="mt-3 grid gap-2">
          {(s === 'submitted' || s === 'reviewing') && (
            <>
              <Btn k="shortlisted" variant="btn-navy" onClick={() => move('shortlisted', 'Shortlisted. The candidate has been notified.')}>Shortlist</Btn>
              <Btn k="interview" onClick={() => setIv(true)}>Schedule interview</Btn>
              <Btn k="rejected" variant="btn-danger" onClick={() => move('rejected', 'Marked as not selected')}>Not a fit</Btn>
            </>
          )}
          {s === 'shortlisted' && (
            <>
              <Btn k="interview" variant="btn-navy" onClick={() => setIv(true)}>Schedule interview</Btn>
              <Btn k="offered" onClick={() => move('offered', 'Offer recorded. The candidate has been notified.')}>Make offer</Btn>
              <Btn k="rejected" variant="btn-danger" onClick={() => move('rejected', 'Marked as not selected')}>Not a fit</Btn>
            </>
          )}
          {s === 'interview' && (
            <>
              <Btn k="offered" variant="btn-navy" onClick={() => move('offered', 'Offer recorded. The candidate has been notified.')}>Make offer</Btn>
              <Btn k="interview" onClick={() => setIv(true)}>Reschedule interview</Btn>
              <Btn k="rejected" variant="btn-danger" onClick={() => move('rejected', 'Marked as not selected')}>Not selected</Btn>
            </>
          )}
          {s === 'offered' && (
            <>
              <Btn k="hired" variant="btn-navy" onClick={() => move('hired', 'Marked as hired. Congratulations!')}>Mark as hired</Btn>
              <Btn k="rejected" variant="btn-danger" onClick={() => move('rejected', 'Offer closed')}>Offer declined</Btn>
            </>
          )}
          {s === 'rejected' && <Btn k="reviewing" onClick={() => move('reviewing', 'Moved back to review')}>Reconsider</Btn>}
          {closed && <p className="text-sm text-ink-3">{s === 'hired' ? 'This candidate was hired. The application is closed.' : 'The candidate withdrew this application.'}</p>}
        </div>
      </section>

      <section className="card p-5">
        <p className="font-semibold">Contact</p>
        {phone || email ? (
          <div className="mt-3 grid gap-2">
            {phone && <a href={`tel:${phone}`} className="btn btn-outline w-full"><Phone size={15} /> {phone}</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full"><MessageCircle size={15} /> WhatsApp</a>}
            {email && <a href={`mailto:${email}`} className="btn btn-outline w-full truncate"><Mail size={15} /> <span className="truncate">{email}</span></a>}
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink-3">Contact details are hidden because this application was withdrawn.</p>
        )}
      </section>

      <Modal
        open={iv}
        onClose={() => setIv(false)}
        title={s === 'interview' ? 'Reschedule interview' : 'Schedule interview'}
        description={`${name} will get a notification with these details.`}
        footer={
          <>
            <button onClick={() => setIv(false)} className="btn btn-outline">Cancel</button>
            <button form="iv-form" className="btn btn-navy" disabled={busy === 'interview'}>{busy === 'interview' ? <Spinner /> : 'Send invite'}</button>
          </>
        }
      >
        <form id="iv-form" onSubmit={schedule} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="iv-at">Date and time</label>
              <input id="iv-at" type="datetime-local" className="input" value={form.at} min={toLocalInput(new Date().toISOString())} onChange={(e) => setForm({ ...form, at: e.target.value })} required />
            </div>
            <div className="field">
              <label className="label" htmlFor="iv-mode">Mode</label>
              <select id="iv-mode" className="input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as typeof form.mode })}>
                {Object.entries(INTERVIEW_MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="iv-loc">{form.mode === 'video' ? 'Meeting link' : form.mode === 'phone' ? 'Phone number we will call from (optional)' : 'Address'}</label>
            <input id="iv-loc" className="input" value={form.location} maxLength={300} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="iv-note">Note for the candidate <span className="font-normal text-ink-4">(optional)</span></label>
            <textarea id="iv-note" className="input" rows={3} maxLength={500} placeholder="Bring your ID proof and certificates." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  )
}
