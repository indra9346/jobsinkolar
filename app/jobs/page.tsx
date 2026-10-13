'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Search,
  MapPin,
  Building2,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Briefcase,
  SlidersHorizontal,
  Sparkles,
  Share2,
  Send,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { JobCard, ApplyModal } from '@/components/site'
import { KOLAR_TALUKS, Job } from '@/lib/jobs-data'

function JobsContent() {
  const params = useSearchParams()
  const detailId = params.get('id')

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Job | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // Filter States
  const [q, setQ] = useState(params.get('q') || '')
  const [location, setLocation] = useState(params.get('location') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [jobType, setJobType] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'salary'>('newest')

  useEffect(() => {
    let alive = true
    async function loadData() {
      setLoading(true)

      // Detail view
      if (detailId) {
        if (supabase) {
          try {
            const { data } = await supabase.from('jobs').select('*').eq('id', detailId).maybeSingle()
            if (alive && data) {
              setDetail(data as Job)
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn('Job detail could not be loaded', e)
          }
        }
        if (alive) {
          setDetail(null)
          setLoading(false)
        }
        return
      }

      // Listing view
      if (!supabase) { if (alive) { setJobs([]); setLoading(false) }; return }
      try {
        let query = supabase.from('jobs').select('*').eq('status', 'published')
        if (q) query = query.ilike('title', `%${q}%`)
        if (location && location !== 'All Taluks') {
          if (KOLAR_TALUKS.includes(location)) query = query.or(`taluk.eq.${location},location.ilike.%${location}%`)
          else query = query.ilike('location', `%${location}%`)
        }
        if (category) query = query.ilike('category', `%${category}%`)
        const { data, error } = await query.order('created_at', { ascending: false }).limit(60)
        if (error) console.warn('Supabase job search failed', error.message)
        if (alive) setJobs((data || []) as Job[])
      } catch (e) {
        console.warn('Supabase job search failed', e)
        if (alive) setJobs([])
      }
      if (alive) setLoading(false)
    }

    loadData()
    return () => { alive = false }
  }, [detailId])

  // Filter local jobs if using fallback data
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (q) {
        const query = q.toLowerCase()
        const matchesTitle = j.title.toLowerCase().includes(query)
        const matchesComp = j.company_name.toLowerCase().includes(query)
        const matchesDesc = j.description.toLowerCase().includes(query)
        if (!matchesTitle && !matchesComp && !matchesDesc) return false
      }
      if (location && location !== 'All Taluks') {
        const locQuery = location.toLowerCase()
        if (!j.location.toLowerCase().includes(locQuery) && !(j.taluk && j.taluk.toLowerCase().includes(locQuery))) {
          return false
        }
      }
      if (category && !j.category.toLowerCase().includes(category.toLowerCase())) {
        return false
      }
      if (jobType && j.employment_type !== jobType) {
        return false
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'salary') {
        return (b.salary_max || 0) - (a.salary_max || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [jobs, q, location, category, jobType, sortBy])

  function clearFilters() {
    setQ('')
    setLocation('')
    setCategory('')
    setJobType('')
  }

  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // === SINGLE JOB DETAIL VIEW ===
  if (detailId) {
    return (
      <main className="page-shell">
        <div className="page-container" style={{ maxWidth: '980px' }}>
          <div style={{ marginBottom: '24px' }}>
            <Link href="/jobs" className="button button-secondary button-sm">
              <ArrowLeft size={15} /> Back to all jobs
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">Loading role details...</div>
          ) : !detail ? (
            <div className="empty-state">
              <h3>Job listing not found</h3>
              <p>This role may have expired or been filled.</p>
              <Link href="/jobs" className="button button-primary button-sm" style={{ marginTop: '16px' }}>
                Browse other Kolar jobs
              </Link>
            </div>
          ) : (
            <article className="panel" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="eyebrow">
                    <Sparkles size={13} /> VERIFIED LOCAL POSITION
                  </span>
                  <h1 style={{ fontSize: '34px', margin: '14px 0 8px' }}>{detail.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', color: 'var(--text-secondary)', fontSize: '15px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Building2 size={17} style={{ color: 'var(--primary)' }} />
                      {detail.company_name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={17} style={{ color: 'var(--primary)' }} />
                      {detail.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={17} style={{ color: 'var(--primary)' }} />
                      {detail.employment_type}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="button button-secondary button-sm"
                    onClick={handleShare}
                    title="Copy job link"
                  >
                    <Share2 size={15} /> {copied ? 'Link Copied!' : 'Share'}
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => setShowApplyModal(true)}
                  >
                    <Send size={15} /> Apply Now
                  </button>
                </div>
              </div>

              {/* Salary & Meta Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  margin: '28px 0',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Offered Compensation</span>
                  <strong style={{ fontSize: '22px', color: '#047857', fontFamily: 'Outfit, sans-serif' }}>
                    {detail.salary_min || detail.salary_max
                      ? `₹${Number(detail.salary_min || 0).toLocaleString('en-IN')} – ₹${Number(detail.salary_max || detail.salary_min || 0).toLocaleString('en-IN')} / month`
                      : 'Competitive / Based on experience'}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="job-pill job-pill-primary">{detail.category}</span>
                  {detail.experience_level && <span className="job-pill">{detail.experience_level}</span>}
                  {detail.taluk && <span className="job-pill">{detail.taluk} Taluk</span>}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Role Overview</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15.5px', whiteSpace: 'pre-wrap' }}>
                  {detail.description}
                </p>
              </div>

              {/* Requirements */}
              {detail.requirements && detail.requirements.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '14px' }}>Requirements & Qualifications</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {detail.requirements.map((req, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-secondary)', fontSize: '15px' }}>
                        <CheckCircle2 size={18} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '3px' }} />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {detail.benefits && detail.benefits.length > 0 && (
                <div style={{ marginBottom: '36px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '14px' }}>Benefits & Perks</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {detail.benefits.map((ben, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-secondary)', fontSize: '15px' }}>
                        <Sparkles size={17} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '3px' }} />
                        <span>{ben}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom CTA Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #eff6ff 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '18px' }}>Interested in this opportunity?</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Apply in 60 seconds with your profile or resume.
                  </p>
                </div>
                <button className="button button-primary button-lg" onClick={() => setShowApplyModal(true)}>
                  <Send size={16} /> Apply for this Job
                </button>
              </div>
            </article>
          )}

          {showApplyModal && detail && (
            <ApplyModal job={detail} onClose={() => setShowApplyModal(false)} />
          )}
        </div>
      </main>
    )
  }

  // === MAIN LISTING VIEW ===
  return (
    <main className="page-shell">
      <div className="page-container">
        <div style={{ marginBottom: '32px' }}>
          <span className="eyebrow">
            <Briefcase size={13} /> VERIFIED JOB DIRECTORY
          </span>
          <h1 className="page-title">Explore Opportunities Across Kolar</h1>
          <p className="page-intro">
            Search published openings across Kolar district and filter by district taluk, verified locality, role, and category.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '32px', alignItems: 'start' }} className="jobs-layout-wrap">
          {/* Filter Sidebar */}
          <aside className="panel" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={17} style={{ color: 'var(--primary)' }} />
                Filter Roles
              </h3>
              <button
                onClick={clearFilters}
                style={{ background: 'none', border: '0', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset All
              </button>
            </div>

            <label className="field">
              Keywords / Role
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. Engineer, Nurse, Operator"
              />
            </label>

            <label className="field">
              Taluk / Location
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                {KOLAR_TALUKS.map((t) => (
                  <option key={t} value={t === 'All Taluks' ? '' : t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Industry Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {['Manufacturing', 'Technology', 'Healthcare', 'Logistics', 'Education', 'Sales', 'Finance', 'Agriculture'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Employment Type
              <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">All Job Types</option>
                {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((jt) => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </label>

            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '8px' }}>
                Hot Job Hubs:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Narasapura', 'Kolar', 'Bangarpet', 'Robertsonpet'].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    className="popular-tag-btn"
                    style={{ fontSize: '11px', padding: '4px 9px' }}
                    onClick={() => setLocation(hub)}
                  >
                    {hub}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Column */}
          <section>
            <div
              className="panel"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ fontSize: '16px', color: 'var(--text-heading)' }}>
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'Opportunity Found' : 'Opportunities Found'}
                </strong>
                {(location || category || q) && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    matching your filters
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'salary')}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    background: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Searching local positions...</div>
            ) : filteredJobs.length > 0 ? (
              <div className="job-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <h3>No jobs matching your exact filter</h3>
                <p style={{ maxWidth: '420px', margin: '8px auto 20px' }}>
                  Try broadening your search keyword or clearing taluk filters. New opportunities from Kolar employers are added daily.
                </p>
                <button className="button button-primary button-sm" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="page-container">Loading jobs portal...</div>
        </main>
      }
    >
      <JobsContent />
    </Suspense>
  )
}
