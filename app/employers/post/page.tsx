'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Area = { id: string; name: string; taluk: string; pincode: string | null }

export default function PostJob() {
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  // Live preview form state
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [category, setCategory] = useState('')
  const [taluk, setTaluk] = useState('Kolar')
  const [taluks, setTaluks] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [areaId, setAreaId] = useState('')
  const [type, setType] = useState('Full-time')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [experience, setExperience] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('taluks').select('name').eq('active', true).order('name'),
      supabase.from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('taluk').order('name'),
      supabase.from('job_categories').select('name').eq('active', true).order('sort_order'),
    ]).then(([talukResult, areaResult, categoryResult]) => {
      setTaluks((talukResult.data || []).map((item) => item.name))
      setAreas((areaResult.data || []) as Area[])
      setCategories((categoryResult.data || []).map((item) => item.name))
    })
  }, [])

  const areasForTaluk = areas.filter((area) => area.taluk === taluk)
  const selectedArea = areas.find((area) => area.id === areaId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg('')
    setSuccess(false)
    setBusy(true)

    const row = {
      title,
      company_name: company,
      category,
      employment_type: type,
      experience_level: experience || '1–3 years',
      taluk,
      area_id: areaId,
      salary_min: Number(salaryMin) || null,
      salary_max: Number(salaryMax) || null,
      description,
      status: 'pending_review',
    }

    if (!supabase) { setMsg('Supabase is not configured.'); setBusy(false); return }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMsg('Sign in with an employer account before submitting a job post.')
        setBusy(false)
        return
      }

      const { error } = await supabase.from('jobs').insert({
        ...row,
        employer_id: user.id,
      })

      if (error) {
        setMsg('Error submitting job: ' + error.message)
      } else {
        setSuccess(true)
        setMsg('Your role has been submitted for review by the Jobs in Kolar administration team.')
        setTitle(''); setCompany(''); setCategory(''); setAreaId(''); setSalaryMin(''); setSalaryMax(''); setExperience(''); setDescription('')
      }
    } catch (err: any) {
      setMsg(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-shell">
      <div className="page-container" style={{ maxWidth: '1100px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span className="eyebrow eyebrow-navy">
            <Building2 size={13} /> EMPLOYER RECRUITMENT PORTAL
          </span>
          <h1 className="page-title">Post a Job Opening in Kolar</h1>
          <p className="page-intro">
            Submit an opening for review and publication in the Kolar district jobs directory.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '36px', alignItems: 'start' }}>
          {/* Submission Form */}
          <div className="panel" style={{ padding: '36px' }}>
            {msg && (
              <div className={`form-message ${success ? 'success' : 'error'}`} role="status">
                <CheckCircle2 size={16} /> <span>{msg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '20px', margin: '0 0 20px' }}>Role Details</h2>

              <label className="field">
                Job Title *
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mechanical Assembly Engineer, Staff Nurse"
                />
              </label>

              <div className="grid-two">
                <label className="field">
                  Company / Organization *
                  <input
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your enterprise name"
                  />
                </label>

                <label className="field">
                  Industry Category *
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid-two">
                <label className="field">
                  Taluk in Kolar *
                  <select
                    value={taluk}
                    onChange={(e) => { setTaluk(e.target.value); setAreaId('') }}
                  >
                    {taluks.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  Verified Area / Locality *
                  <select required value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                    <option value="" disabled>Select verified area</option>
                    {areasForTaluk.map((area) => <option key={area.id} value={area.id}>{area.name}{area.pincode ? ` · ${area.pincode}` : ''}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid-two">
                <label className="field">
                  Employment Type
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Temporary</option>
                    <option>Internship</option>
                  </select>
                </label>

                <label className="field">
                  Experience Level
                  <input
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. Fresher friendly, 2–4 years"
                  />
                </label>
              </div>

              <div className="grid-two">
                <label className="field">
                  Minimum Monthly Salary (₹)
                  <input
                    type="number"
                    min="0"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="e.g. 25000"
                  />
                </label>

                <label className="field">
                  Maximum Monthly Salary (₹)
                  <input
                    type="number"
                    min="0"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="e.g. 40000"
                  />
                </label>
              </div>

              <label className="field">
                Detailed Job Description & Requirements *
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline responsibilities, required skills, shifts, and why someone should work with you..."
                />
              </label>

              <button className="button button-primary button-lg" style={{ width: '100%', marginTop: '12px' }} disabled={busy || !areaId}>
                {busy ? 'Submitting Role...' : 'Submit Job Listing for Review'}
              </button>
              {msg.includes('Sign in') && <p style={{ textAlign: 'center', marginTop: 12 }}><Link href="/auth?mode=signin">Sign in</Link> or <Link href="/auth?mode=signup">create an employer account</Link>.</p>}
            </form>
          </div>

          {/* Live Preview Card */}
          <div>
            <div className="panel" style={{ padding: '28px', border: '1.5px dashed var(--primary-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Eye size={17} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  Live Listing Preview
                </span>
              </div>

              <div className="job-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="job-card-top">
                  <span className="job-company-avatar">
                    {company ? company.charAt(0).toUpperCase() : 'E'}
                  </span>
                  <div className="job-company-info">
                    <span className="job-company-name">{company || 'Your Enterprise'}</span>
                    <div className="job-location-row">
                      <MapPin size={13} style={{ color: 'var(--primary)' }} />
                      <span>{selectedArea ? `${selectedArea.name}, ${taluk}` : `${taluk}, Kolar`}</span>
                    </div>
                  </div>
                </div>

                <div className="job-title-link">
                  {title || 'Job Title Appears Here'}
                </div>

                <div className="job-badges-wrap">
                  <span className="job-pill job-pill-primary">{type}</span>
                  <span className="job-pill">{category || 'Category'}</span>
                  {experience && <span className="job-pill">{experience}</span>}
                </div>

                <div className="job-card-bottom">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Monthly Pay</span>
                    <span className="salary-tag">
                      {salaryMin || salaryMax
                        ? `₹${Number(salaryMin || 0).toLocaleString('en-IN')} – ₹${Number(salaryMax || salaryMin || 0).toLocaleString('en-IN')}`
                        : 'Based on experience'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', background: 'var(--bg-soft)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-light)' }}>
                <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--emerald)' }} />
                  Moderation Guarantee
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Submissions are reviewed within 2 hours to ensure quality and prevent duplicate or spam listings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
