'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BadgeCheck, Clock, ExternalLink, Upload } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Avatar, PageHeader, Spinner } from '@/components/ui/bits'
import { COMPANY_SIZES, INDUSTRIES, TALUKS } from '@/lib/constants'
import { logoUrl, safeFileName } from '@/lib/storage'
import type { Company } from '@/lib/types'

type Priv = { contact_name: string | null; contact_phone: string | null; contact_email: string | null; gstin: string | null; billing_address: string | null } | null

export function CompanyForm({ userId, company, priv, welcome }: { userId: string; company: Company | null; priv: Priv; welcome: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [c, setC] = useState({
    name: company?.name ?? '',
    industry: company?.industry ?? '',
    company_size: company?.company_size ?? '',
    website: company?.website ?? '',
    about: company?.about ?? '',
    taluk: company?.taluk ?? '',
    address: company?.address ?? '',
  })
  const [p, setP] = useState({
    contact_name: priv?.contact_name ?? '',
    contact_phone: priv?.contact_phone ?? '',
    contact_email: priv?.contact_email ?? '',
    gstin: priv?.gstin ?? '',
    billing_address: priv?.billing_address ?? '',
  })
  const [logo, setLogo] = useState(company?.logo_path ?? null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const file = useRef<HTMLInputElement>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (c.name.trim().length < 2) err.name = 'Enter the company name'
    if (c.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(c.website.trim())) err.website = 'Start with https://'
    if (p.contact_phone && !/^[6-9]\d{9}$/.test(p.contact_phone.replace(/\D/g, '').slice(-10))) err.contact_phone = 'Enter a valid 10-digit mobile number'
    if (p.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(p.gstin.trim().toUpperCase())) err.gstin = 'Enter a valid 15-character GSTIN'
    if (p.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact_email.trim())) err.contact_email = 'Enter a valid email'
    setErrors(err)
    if (Object.keys(err).length) return
    setBusy(true)
    const sb = getSupabase()
    const [r1, r2] = await Promise.all([
      sb.from('companies').update({
        name: c.name.trim(),
        industry: c.industry || null,
        company_size: c.company_size || null,
        website: c.website.trim() || null,
        about: c.about.trim() || null,
        taluk: c.taluk || null,
        address: c.address.trim() || null,
      }).eq('id', userId),
      sb.from('company_private').upsert({
        id: userId,
        contact_name: p.contact_name.trim() || null,
        contact_phone: p.contact_phone ? p.contact_phone.replace(/\D/g, '').slice(-10) : null,
        contact_email: p.contact_email.trim().toLowerCase() || null,
        gstin: p.gstin.trim().toUpperCase() || null,
        billing_address: p.billing_address.trim() || null,
      }),
    ])
    // Keep the name on the profile in sync for older records.
    await sb.from('profiles').update({ company_name: c.name.trim() }).eq('id', userId)
    setBusy(false)
    if (r1.error || r2.error) return toast((r1.error ?? r2.error)!.message, 'error')
    toast('Company profile saved')
    router.refresh()
  }

  const uploadLogo = async (f: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return toast('Upload a PNG, JPG or WebP image', 'error')
    if (f.size > 1024 * 1024) return toast('Logo must be under 1 MB', 'error')
    setUploading(true)
    const sb = getSupabase()
    const path = `${userId}/logo-${Date.now()}-${safeFileName(f.name)}`
    const up = await sb.storage.from('company-logos').upload(path, f, { contentType: f.type, cacheControl: '31536000' })
    if (up.error) {
      setUploading(false)
      return toast(up.error.message, 'error')
    }
    const { error } = await sb.from('companies').update({ logo_path: path }).eq('id', userId)
    if (!error && logo) await sb.storage.from('company-logos').remove([logo])
    setUploading(false)
    if (error) return toast(error.message, 'error')
    setLogo(path)
    toast('Logo updated')
    router.refresh()
  }

  const e = (k: string) => errors[k] && <p className="error-text">{errors[k]}</p>

  return (
    <>
      <PageHeader
        title="Company profile"
        description="This appears on your company page and on every job you post."
        actions={company?.slug && <Link href={`/companies/${company.slug}`} target="_blank" className="btn btn-outline btn-sm"><ExternalLink size={14} /> View public page</Link>}
      />
      {welcome && <div className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your employer account is ready with 2 free job posts. Complete your company details below, then post your first job.</div>}
      <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5">
          <section className="card grid gap-4 p-5">
            <div className="flex items-center gap-4">
              <Avatar name={c.name} src={logoUrl(logo)} size={64} square />
              <div>
                <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(ev) => ev.target.files?.[0] && uploadLogo(ev.target.files[0])} />
                <button type="button" onClick={() => file.current?.click()} className="btn btn-outline btn-sm" disabled={uploading}>
                  {uploading ? <Spinner size={14} /> : <><Upload size={14} /> {logo ? 'Change logo' : 'Upload logo'}</>}
                </button>
                <p className="mt-1 text-xs text-ink-3">Square PNG or JPG, under 1 MB.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="name">Company name</label>
                <input id="name" className="input" value={c.name} onChange={(ev) => setC({ ...c, name: ev.target.value })} maxLength={120} aria-invalid={!!errors.name} />
                {e('name')}
              </div>
              <div className="field">
                <label className="label" htmlFor="industry">Industry</label>
                <select id="industry" className="input" value={c.industry} onChange={(ev) => setC({ ...c, industry: ev.target.value })}>
                  <option value="">Select</option>
                  {INDUSTRIES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="size">Company size</label>
                <select id="size" className="input" value={c.company_size} onChange={(ev) => setC({ ...c, company_size: ev.target.value })}>
                  <option value="">Select</option>
                  {COMPANY_SIZES.map((x) => <option key={x} value={x}>{x} employees</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="website">Website</label>
                <input id="website" className="input" placeholder="https://" value={c.website} onChange={(ev) => setC({ ...c, website: ev.target.value })} aria-invalid={!!errors.website} />
                {e('website')}
              </div>
              <div className="field">
                <label className="label" htmlFor="taluk">Taluk</label>
                <select id="taluk" className="input" value={c.taluk} onChange={(ev) => setC({ ...c, taluk: ev.target.value })}>
                  <option value="">Select</option>
                  {TALUKS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="address">Office / factory address</label>
                <textarea id="address" className="input" rows={2} maxLength={300} value={c.address} onChange={(ev) => setC({ ...c, address: ev.target.value })} />
              </div>
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="about">About the company</label>
                <textarea id="about" className="input" rows={5} maxLength={4000} placeholder="What you make or do, how many people work there, what makes it a good employer." value={c.about} onChange={(ev) => setC({ ...c, about: ev.target.value })} />
              </div>
            </div>
          </section>

          <section className="card grid gap-4 p-5">
            <div>
              <h2 className="font-semibold">Private details</h2>
              <p className="text-[13px] text-ink-3">Used for verification and GST invoices. Never shown publicly.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="cn">Hiring contact name</label>
                <input id="cn" className="input" value={p.contact_name} onChange={(ev) => setP({ ...p, contact_name: ev.target.value })} />
              </div>
              <div className="field">
                <label className="label" htmlFor="cp">Contact mobile</label>
                <input id="cp" className="input" inputMode="tel" value={p.contact_phone} onChange={(ev) => setP({ ...p, contact_phone: ev.target.value })} aria-invalid={!!errors.contact_phone} />
                {e('contact_phone')}
              </div>
              <div className="field">
                <label className="label" htmlFor="ce">Contact email</label>
                <input id="ce" className="input" type="email" value={p.contact_email} onChange={(ev) => setP({ ...p, contact_email: ev.target.value })} aria-invalid={!!errors.contact_email} />
                {e('contact_email')}
              </div>
              <div className="field">
                <label className="label" htmlFor="gst">GSTIN <span className="font-normal text-ink-4">(optional)</span></label>
                <input id="gst" className="input uppercase" maxLength={15} value={p.gstin} onChange={(ev) => setP({ ...p, gstin: ev.target.value.toUpperCase() })} aria-invalid={!!errors.gstin} />
                {e('gstin')}
              </div>
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="ba">Billing address</label>
                <textarea id="ba" className="input" rows={2} maxLength={500} value={p.billing_address} onChange={(ev) => setP({ ...p, billing_address: ev.target.value })} />
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5">
            {company?.verified ? (
              <p className="flex items-center gap-2 font-semibold text-navy-700"><BadgeCheck size={18} /> Verified</p>
            ) : (
              <>
                <p className="flex items-center gap-2 font-semibold"><Clock size={17} className="text-amber-600" /> Verification pending</p>
                <p className="mt-1 text-sm text-ink-3">Add your address, industry and a short description. A GSTIN or website speeds it up.</p>
              </>
            )}
          </section>
          <div className="card p-5">
            <button className="btn btn-navy w-full" disabled={busy}>{busy ? <Spinner /> : 'Save company profile'}</button>
          </div>
        </aside>
      </form>
    </>
  )
}
