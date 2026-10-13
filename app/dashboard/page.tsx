'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User,
  Briefcase,
  FileText,
  MapPin,
  Phone,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  LogOut,
  ExternalLink,
  Sparkles,
  Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/StatusBadge'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [accountStatus, setAccountStatus] = useState<string>('active')
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApps] = useState<any[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'saved' | 'profile'>('overview')

  useEffect(() => {
    let profileChannel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined
    let alive = true
    async function loadDashboard() {
      // Check Supabase Auth
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser()
          if (data?.user) {
            setUser(data.user)
            const [pr, sv] = await Promise.all([
              supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
              supabase.from('saved_jobs').select('jobs(*)').eq('candidate_id', data.user.id),
            ])
            setProfile(pr.data || {})
            setAccountStatus(pr.data?.account_status || 'active')
            setSavedJobs((sv.data || []).map((x: any) => x.jobs).filter(Boolean))
            profileChannel = supabase.channel(`profile-status-${data.user.id}`)
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${data.user.id}` }, (payload) => {
                const updated = payload.new as any
                setProfile((current: any) => ({ ...current, ...updated }))
                setAccountStatus(updated.account_status || 'active')
              }).subscribe()
            if (!alive && profileChannel) void supabase.removeChannel(profileChannel)

            if (pr.data?.account_status && pr.data.account_status !== 'active') {
              setLoading(false)
              return
            }

            if (data.user.user_metadata?.role === 'employer') {
              const jr = await supabase.from('jobs').select('*').eq('employer_id', data.user.id).order('created_at', { ascending: false })
              setJobs(jr.data || [])
              // Candidate identities and applications are private to administrators.
              setApplicants([])
            } else {
              const r = await supabase.from('applications').select('*,jobs(title,company_name,location)').eq('candidate_id', data.user.id).order('created_at', { ascending: false })
              setApps(r.data || [])
            }
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('Supabase dashboard load failed', e)
        }
      }

      setLoading(false)
    }

    loadDashboard()
    return () => { alive = false; if (profileChannel && supabase) void supabase.removeChannel(profileChannel) }
  }, [])

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    window.location.href = '/'
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    const fd = new FormData(e.currentTarget)
    const values = {
      full_name: fd.get('full_name'),
      phone: fd.get('phone'),
      location: fd.get('location'),
      headline: fd.get('headline'),
      bio: fd.get('bio'),
      skills: String(fd.get('skills') || '').split(',').map((s) => s.trim()).filter(Boolean),
      company_name: fd.get('company_name'),
      company_website: fd.get('company_website'),
      company_description: fd.get('company_description'),
    }

    if (supabase && user?.id) {
      const { error } = await supabase.from('profiles').update(values).eq('id', user.id)
      if (error) {
        setMessage('Error saving profile: ' + error.message)
        return
      }
    }

    setProfile({ ...profile, ...values })
    setMessage('Profile updated successfully!')
  }

  const isEmployer = user?.user_metadata?.role === 'employer'

  const calculateCompletion = () => {
    if (!profile) return 30
    let score = 0
    if (profile.full_name) score += 25
    if (profile.phone) score += 20
    if (profile.location) score += 15
    if (profile.headline || profile.company_name) score += 20
    if ((profile.skills && profile.skills.length > 0) || profile.company_description || profile.bio) score += 20
    return Math.min(100, score)
  }

  const completionRate = calculateCompletion()

  if (!loading && accountStatus !== 'active') {
    return <main className="page-shell"><div className="page-container" style={{ maxWidth: 720 }}><div className="panel" style={{ textAlign: 'center', padding: 42 }}><AlertCircle size={32} color="var(--primary)" /><h1 className="page-title" style={{ fontSize: 30 }}>Account {accountStatus}</h1><p className="page-intro">This account has been {accountStatus} by the Jobs in Kolar administration team. Contact support if you think this is a mistake.</p><button className="button button-primary" onClick={handleSignOut}><LogOut size={15} /> Sign out</button></div></div></main>
  }

  if (!loading && !user) {
    return <main className="page-shell"><div className="page-container" style={{ maxWidth: 720 }}><div className="panel" style={{ textAlign: 'center', padding: 42 }}><User size={30} color="var(--primary)" /><h1 className="page-title" style={{ fontSize: 30 }}>Sign in to your dashboard</h1><p className="page-intro">Create an account or sign in to manage your profile, applications, saved jobs, and job alerts.</p><Link href="/auth?mode=signin" className="button button-primary">Sign in or create account</Link></div></div></main>
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        {/* Welcome Banner */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> {isEmployer ? 'EMPLOYER WORKSPACE' : 'CANDIDATE DASHBOARD'}
            </span>
            <h1 style={{ fontSize: '32px', margin: '12px 0 6px' }}>
              Welcome, {profile?.full_name || user?.user_metadata?.full_name || 'Member'}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
              {isEmployer
                ? 'Manage your job listings and view incoming candidate applications.'
                : 'Track your application status, saved jobs, and profile visibility.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href={isEmployer ? '/employers/post' : '/jobs'}
              className="button button-primary"
            >
              {isEmployer ? <><Briefcase size={15} /> Post New Role</> : 'Explore Openings'}
            </Link>
            {profile?.is_admin && <Link href="/admin" className="button button-secondary"><ShieldCheck size={15} /> Admin Panel</Link>}
            <button className="button button-secondary" onClick={handleSignOut}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Profile Completion Meter Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 100%)',
            borderRadius: '20px',
            padding: '24px 28px',
            color: '#ffffff',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                Profile Strength & Verification
              </span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#f43f5e' }}>
                {completionRate}% Complete
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#cbd5e1' }}>
              {completionRate === 100
                ? 'Your profile is 100% complete and fully verified for Kolar employers.'
                : 'Add your mobile number, locality, and top skills in the Edit Profile tab to reach 100% visibility.'}
            </p>
          </div>

          <button
            className="button button-sm"
            onClick={() => setActiveTab('profile')}
            style={{ background: '#ffffff', color: '#1e1b4b', fontWeight: 700, border: 'none' }}
          >
            Enhance Profile
          </button>
        </div>

        {/* Dashboard Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <button
            className={`button button-sm ${activeTab === 'overview' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`button button-sm ${activeTab === 'applications' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setActiveTab('applications')}
          >
            {isEmployer ? `Applicants (${applicants.length})` : `My Applications (${applications.length})`}
          </button>
          {!isEmployer && (
            <button
              className={`button button-sm ${activeTab === 'saved' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Jobs ({savedJobs.length})
            </button>
          )}
          {isEmployer && (
            <Link
              href="/candidates"
              className="button button-sm button-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={14} /> Talent Pool
            </Link>
          )}
          <button
            className={`button button-sm ${activeTab === 'profile' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>{isEmployer ? 'Active Postings' : 'Total Applied'}</h3>
                  <strong style={{ fontSize: '26px', color: 'var(--text-heading)' }}>
                    {isEmployer ? jobs.length : applications.length}
                  </strong>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                {isEmployer ? 'Reviewed and live positions across Kolar' : 'Opportunities submitted to verified employers'}
              </p>
            </div>

            <div className="panel" style={{ display: isEmployer ? 'none' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'grid', placeItems: 'center' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Under Review</h3>
                  <strong style={{ fontSize: '26px', color: 'var(--text-heading)' }}>
                    {isEmployer ? applicants.filter(a => a.status === 'reviewing').length : applications.filter(a => a.status === 'reviewing').length}
                  </strong>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                Applications currently being processed by hiring managers
              </p>
            </div>

            <div className="panel" style={{ display: isEmployer ? 'none' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--emerald-light)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Shortlisted</h3>
                  <strong style={{ fontSize: '26px', color: 'var(--text-heading)' }}>
                    {isEmployer ? applicants.filter(a => a.status === 'shortlisted').length : applications.filter(a => a.status === 'shortlisted').length}
                  </strong>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                Candidates progressed to interview stage
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: APPLICATIONS / APPLICANTS */}
        {activeTab === 'applications' && (
          <div className="panel">
            <h2 style={{ fontSize: '22px', margin: '0 0 20px' }}>
              {isEmployer ? 'Candidate Applications' : 'Your Job Applications'}
            </h2>

            {isEmployer ? (
              <div className="empty-state">Candidate profiles and application details are handled privately by the Jobs in Kolar administrator team.</div>
            ) : (
              applications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {applications.map((app) => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div>
                        <strong style={{ fontSize: '16px', display: 'block' }}>{app.jobs?.title}</strong>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{app.jobs?.company_name} · {app.jobs?.location}</span>
                      </div>
                      <StatusBadge status={app.status || 'applied'} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">You haven’t applied for any jobs yet. <Link href="/jobs">Browse open roles</Link>.</div>
              )
            )}
          </div>
        )}

        {/* TAB 3: SAVED JOBS */}
        {activeTab === 'saved' && !isEmployer && (
          <div className="panel">
            <h2 style={{ fontSize: '22px', margin: '0 0 20px' }}>Saved Jobs</h2>
            {savedJobs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {savedJobs.map((j) => (
                  <div key={j.id} style={{ padding: '20px', background: 'var(--bg-soft)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{j.title}</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', margin: '4px 0 14px' }}>
                      {j.company_name} · {j.location}
                    </span>
                    <Link href={`/jobs?id=${j.id}`} className="button button-primary button-sm">
                      View Role
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No saved jobs yet. Tap the heart on any job card to bookmark it for later.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <div className="panel">
            <h2 style={{ fontSize: '22px', margin: '0 0 20px' }}>
              {isEmployer ? 'Update Company Profile' : 'Update Candidate Profile'}
            </h2>

            {message && (
              <div className="form-message success" role="status">
                <CheckCircle2 size={16} /> {message}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="grid-two">
                <label className="field">
                  {isEmployer ? 'Primary Contact Name' : 'Full Name'}
                  <input name="full_name" defaultValue={profile?.full_name || ''} required />
                </label>
                <label className="field">
                  Phone Number
                  <input name="phone" defaultValue={profile?.phone || ''} type="tel" placeholder="10-digit mobile" />
                </label>
              </div>

              <div className="grid-two">
                <label className="field">
                  Location in Kolar
                  <input name="location" defaultValue={profile?.location || ''} placeholder="e.g. Narasapura, Kolar Town, KGF" />
                </label>
                {isEmployer ? (
                  <label className="field">
                    Company Name
                    <input name="company_name" defaultValue={profile?.company_name || ''} placeholder="Your business name" />
                  </label>
                ) : (
                  <label className="field">
                    Professional Headline
                    <input name="headline" defaultValue={profile?.headline || ''} placeholder="e.g. CNC Operator / Staff Nurse" />
                  </label>
                )}
              </div>

              {!isEmployer && (
                <label className="field">
                  Key Skills (comma separated)
                  <input name="skills" defaultValue={(profile?.skills || []).join(', ')} placeholder="e.g. Welding, AutoCAD, Tally, English, First Aid" />
                </label>
              )}

              <label className="field">
                {isEmployer ? 'About the Company & Culture' : 'Brief Bio & Experience'}
                <textarea
                  name={isEmployer ? 'company_description' : 'bio'}
                  defaultValue={isEmployer ? profile?.company_description || '' : profile?.bio || ''}
                  rows={4}
                  placeholder="Share a short summary..."
                />
              </label>

              <button className="button button-primary" style={{ marginTop: '12px' }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
