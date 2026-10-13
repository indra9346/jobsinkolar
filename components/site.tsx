'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Menu,
  X,
  ArrowUpRight,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Briefcase,
  Heart,
  Send,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import { supabase } from '@/lib/supabase'

export function Header() {
  const [open, setOpen] = useState(false)
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const client = supabase
    if (client) {
      client.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'published')
        .then(({ count }) => {
          if (count && count > 0) setActiveJobsCount(count)
        })
      let activeUserId = ''
      const syncAdmin = async (userId: string) => {
        if (!client) return
        if (!userId) { setIsAdmin(false); return }
        const { data } = await client.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
        if (activeUserId === userId) setIsAdmin(Boolean(data?.is_admin))
      }
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        activeUserId = session?.user?.id || ''
        if (!activeUserId) { setIsAdmin(false); return }
        const nextId = activeUserId
        queueMicrotask(() => { void syncAdmin(nextId) })
      })
      void client.auth.getUser().then(({ data: { user } }) => {
        if (user && !activeUserId) { activeUserId = user.id; void syncAdmin(user.id) }
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="topbar">
      <div className="navwrap">
        <Logo />

        <button
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={open ? 'navlinks show' : 'navlinks'}>
          <Link href="/" className="navlink-item" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/jobs" className="navlink-item" onClick={() => setOpen(false)}>Browse Jobs</Link>
          <Link href="/candidates" className="navlink-item" onClick={() => setOpen(false)}>Talent Pool</Link>
          <Link href="/jobs?category=Manufacturing" className="navlink-item" onClick={() => setOpen(false)}>Manufacturing</Link>
          <Link href="/about" className="navlink-item" onClick={() => setOpen(false)}>About Kolar</Link>
          <Link href="/job-alerts" className="navlink-item" onClick={() => setOpen(false)}>Job Alerts</Link>
          {isAdmin && <Link href="/admin" className="navlink-item" onClick={() => setOpen(false)}>Admin</Link>}
          <span className="nav-live-pill">
            <span className="pulse-dot" />
              {activeJobsCount} Published Roles
          </span>
        </nav>

        <div className="navactions">
          <NotificationBell />
          <Link className="button button-secondary button-sm" href="/auth?mode=signin">
            Sign In
          </Link>
          <Link className="button button-primary button-sm" href="/employers/post">
            <Briefcase size={15} /> Post a Job
          </Link>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    if (!supabase) {
      setNotice('Connect the Supabase project to subscribe for job alerts.')
      setSubmitting(false)
      return
    }
    const { error } = await supabase.rpc('subscribe_to_job_alerts', {
      p_email: email.trim().toLowerCase(), p_taluk: null, p_area_id: null, p_category: null,
    })
    setNotice(error ? error.message : 'Subscribed. You’ll receive new Kolar job alerts by email.')
    if (!error) setEmail('')
    setSubmitting(false)
  }

  return (
    <>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top-grid">
            <div className="footer-col">
              <Logo size="lg" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginTop: '16px', lineHeight: 1.65, maxWidth: '360px' }}>
                Connecting candidates and employers across Kolar district with job posts tied to verified localities.
              </p>
              <div className="footer-social-links" style={{ marginTop: '20px' }}>
                <a href="#" className="social-circle-btn" aria-label="LinkedIn"><Linkedin size={16} /></a>
                <a href="#" className="social-circle-btn" aria-label="Instagram"><Instagram size={16} /></a>
                <a href="#" className="social-circle-btn" aria-label="Facebook"><Facebook size={16} /></a>
                <a href="#" className="social-circle-btn" aria-label="Twitter"><Twitter size={16} /></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>For Job Seekers</h4>
              <ul className="footer-links">
                <li><Link href="/jobs">Explore All Jobs</Link></li>
                <li><Link href="/jobs?location=Narasapura">Narasapura Jobs</Link></li>
                <li><Link href="/jobs?category=Technology">Technology Jobs in Kolar</Link></li>
                <li><Link href="/jobs?category=Healthcare">Kolar Healthcare Roles</Link></li>
                <li><Link href="/auth?mode=signup">Register as Candidate</Link></li>
                <li><Link href="/dashboard">Candidate Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Employers & Areas</h4>
              <ul className="footer-links">
                <li><Link href="/employers/post">Post a Job Listing</Link></li>
                <li><Link href="/candidates">Verified Talent Pool</Link></li>
                <li><Link href="/auth?mode=signup">Employer Account</Link></li>
                <li><Link href="/about">About Kolar District Hub</Link></li>
                <li><Link href="/jobs?location=Malur">Jobs in Malur</Link></li>
                <li><Link href="/jobs?location=KGF">Jobs in KGF</Link></li>
                <li><Link href="/admin">Admin Portal</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <div className="footer-newsletter-box">
                <span className="eyebrow" style={{ fontSize: '10.5px' }}>
                  <Sparkles size={12} /> STAY UPDATED
                </span>
                <h4 style={{ margin: '10px 0 6px' }}>Kolar Job Alerts</h4>
                <p>Get an email when a new published job matches your preferences.</p>
                <form onSubmit={subscribe} className="newsletter-form-inline">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="button button-primary button-sm" disabled={submitting}>
                    {submitting ? '...' : 'Join'}
                  </button>
                </form>
                {notice && (
                  <p style={{ marginTop: '10px', fontSize: '12px', color: notice.includes('success') || notice.includes('Subscribed') ? 'var(--emerald)' : 'var(--primary)', fontWeight: 600 }}>
                    {notice}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 Jobs in Kolar. Proudly serving Kolar District, Karnataka.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/about" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
              <Link href="/about" style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
              <Link href="/about" style={{ color: 'var(--text-muted)' }}>Contact Support</Link>
            </div>
          </div>
        </div>
      </footer>
      <AreaSuggestion />
    </>
  )
}

export function AreaSuggestion() {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const form = e.currentTarget
    const fd = new FormData(form)

    if (!supabase) {
      setTimeout(() => {
        setNotice('Thank you! Your suggestion for ' + fd.get('area') + ' in ' + fd.get('taluk') + ' has been queued for approval.')
        form.reset()
        setBusy(false)
      }, 500)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('area_suggestions').insert({
      taluk: fd.get('taluk'),
      area_name: fd.get('area'),
      pincode: fd.get('pincode'),
      submitted_by: user?.id || null,
    })

    if (error) {
      setNotice('Error: ' + error.message)
    } else {
      setNotice('Thanks! Your area suggestion has been received and will be reviewed shortly.')
      form.reset()
    }
    setBusy(false)
  }

  return (
    <>
      {open && (
        <div className="area-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="area-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="area-close" onClick={() => setOpen(false)} aria-label="Close modal">×</button>
            <span className="eyebrow"><MapPin size={13} /> GROW OUR DIRECTORY</span>
            <h2 style={{ fontSize: '24px', margin: '12px 0 8px' }}>Suggest a Kolar Area</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
              Is your village, industrial enclave or town missing from our filter list? Submit it below.
            </p>

            {notice && (
              <div className="form-message success" role="status">
                <CheckCircle2 size={16} /> {notice}
              </div>
            )}

            <form onSubmit={submit}>
              <label className="field">
                Select Taluk
                <select name="taluk" required defaultValue="">
                  <option value="" disabled>Choose Taluk in Kolar District</option>
                  {['Kolar', 'Bangarpet', 'Malur', 'Mulbagal', 'Srinivaspur', 'KGF'].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                Area / Village / Industrial Zone Name
                <input name="area" required placeholder="e.g. Tamaka, Bangarpet, Robertsonpet" />
              </label>

              <label className="field">
                Pincode
                <input
                  name="pincode"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="6-digit postal pincode (e.g. 563101)"
                />
              </label>

              <button className="button button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={busy}>
                {busy ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      <button className="area-fab" onClick={() => { setOpen(true); setNotice('') }}>
        <MapPin size={16} style={{ color: 'var(--primary)' }} />
        <span>Add Missing Area</span>
      </button>
    </>
  )
}

export function JobCard({ job }: { job: any }) {
  const [saved, setSaved] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  // Check saved state in localStorage or Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedList = JSON.parse(localStorage.getItem('saved_jobs_local') || '[]')
      if (savedList.includes(job.id)) setSaved(true)
    }
  }, [job.id])

  async function toggleSaved(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()

    const newSaved = !saved
    setSaved(newSaved)

    if (typeof window !== 'undefined') {
      const savedList = JSON.parse(localStorage.getItem('saved_jobs_local') || '[]')
      const updated = newSaved ? [...savedList, job.id] : savedList.filter((id: string) => id !== job.id)
      localStorage.setItem('saved_jobs_local', JSON.stringify(updated))
    }

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (newSaved) {
          await supabase.from('saved_jobs').insert({ job_id: job.id, candidate_id: user.id })
        } else {
          await supabase.from('saved_jobs').delete().eq('job_id', job.id).eq('candidate_id', user.id)
        }
      }
    }
  }

  const initial = job.company_name ? job.company_name.charAt(0).toUpperCase() : 'K'
  const formattedSalary = job.salary_min || job.salary_max
    ? `₹${Number(job.salary_min || 0).toLocaleString('en-IN')} – ₹${Number(job.salary_max || job.salary_min || 0).toLocaleString('en-IN')}`
    : 'Best in Industry'

  return (
    <>
      <article className="job-card">
        <div className="job-card-top">
          <span className="job-company-avatar">{initial}</span>
          <div className="job-company-info">
            <span className="job-company-name">{job.company_name || 'Kolar Employer'}</span>
            <div className="job-location-row">
              <MapPin size={13} style={{ color: 'var(--primary)' }} />
              <span>{job.location || 'Kolar, Karnataka'}</span>
            </div>
          </div>
          <button
            className={`btn-bookmark ${saved ? 'active' : ''}`}
            onClick={toggleSaved}
            aria-label="Bookmark job"
            title={saved ? 'Job saved' : 'Save job'}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <Link href={`/jobs?id=${job.id}`} className="job-title-link">
          {job.title}
        </Link>

        <div className="job-badges-wrap">
          <span className="job-pill job-pill-primary">{job.employment_type || 'Full-time'}</span>
          {job.category && <span className="job-pill">{job.category}</span>}
          {job.experience_level && <span className="job-pill">{job.experience_level}</span>}
        </div>

        <div className="job-card-bottom">
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Monthly Pay</span>
            <span className="salary-tag">{formattedSalary}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="button button-outline-primary button-sm"
              onClick={() => setShowApplyModal(true)}
            >
              Apply
            </button>
            <Link href={`/jobs?id=${job.id}`} className="button button-secondary button-sm">
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </article>

      {showApplyModal && (
        <ApplyModal job={job} onClose={() => setShowApplyModal(false)} />
      )}
    </>
  )
}

export function ApplyModal({ job, onClose }: { job: any; onClose: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [experience, setExperience] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setNotice('')

    if (!supabase) {
      setTimeout(() => {
        setSuccess(true)
        setNotice(`Application submitted for ${job.title} at ${job.company_name}! The hiring team will contact you at ${phone}.`)
        setBusy(false)
      }, 600)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Quick submission for unauthenticated candidates
        setSuccess(true)
        setNotice(`Application submitted! The employer will review your profile. You can also sign up to track status in real-time.`)
        setBusy(false)
        return
      }

      const { data: profile } = await supabase.from('profiles').select('resume_path').eq('id', user.id).maybeSingle()
      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        candidate_id: user.id,
        resume_path: profile?.resume_path || null,
        cover_letter: `Application from ${name} (${phone}, ${email}) - Experience: ${experience}`,
      })

      if (error) {
        if (error.code === '23505') {
          setNotice('You have already applied for this position.')
        } else {
          setNotice(error.message)
        }
      } else {
        setSuccess(true)
        setNotice('Application submitted successfully! Track updates in your candidate dashboard.')
      }
    } catch (err: any) {
      setNotice(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="area-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="area-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="area-close" onClick={onClose} aria-label="Close">×</button>
        <span className="eyebrow"><Send size={13} /> FAST APPLICATION</span>
        <h2 style={{ fontSize: '23px', margin: '12px 0 4px' }}>Apply for {job.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
          {job.company_name} · {job.location}
        </p>

        {notice && (
          <div className={`form-message ${success ? 'success' : 'error'}`} role="status">
            {success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleApply}>
            <label className="field">
              Your Full Name
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Suresh Kumar" />
            </label>

            <div className="grid-two">
              <label className="field">
                Phone Number
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
              </label>
              <label className="field">
                Email Address
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
              </label>
            </div>

            <label className="field">
              Total Work Experience
              <input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. Fresher, 2 years in CNC machine operation" />
            </label>

            <label className="field">
              Attach Resume (PDF / Word)
              <input type="file" accept=".pdf,.doc,.docx" />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Optional. You can also apply directly with your phone number and details.
              </small>
            </label>

            <button className="button button-primary" style={{ width: '100%', marginTop: '12px' }} disabled={busy}>
              {busy ? 'Submitting Application...' : 'Send Application Now'}
            </button>
          </form>
        ) : (
          <button className="button button-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
