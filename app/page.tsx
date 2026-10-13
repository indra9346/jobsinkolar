'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  MapPin,
  Factory,
  Laptop,
  HeartPulse,
  Truck,
  GraduationCap,
  Sparkles,
  Building2,
  Users2,
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobCard } from '@/components/site'
import { JOB_CATEGORY_STYLES, KOLAR_TALUKS, Job } from '@/lib/jobs-data'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [talukCounts, setTalukCounts] = useState<Record<string, number>>({})
  const [activeJobCount, setActiveJobCount] = useState(0)
  const [verifiedAreaCount, setVerifiedAreaCount] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [taluk, setTaluk] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'mfg' | 'tech' | 'health'>('all')

  useEffect(() => {
    let alive = true
    async function loadJobs() {
      if (!supabase) return
      const [latest, jobCount, jobRows, areaCount, categoryRows] = await Promise.all([
        supabase.from('jobs').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(6),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('jobs').select('taluk,category').eq('status', 'published').limit(1000),
        supabase.from('areas').select('id', { count: 'exact', head: true }).eq('active', true).eq('verified', true),
        supabase.from('job_categories').select('name,slug,description').eq('active', true).order('sort_order'),
      ])
      if (!alive) return
      setJobs((latest.data || []) as Job[])
      setActiveJobCount(jobCount.count || 0)
      setVerifiedAreaCount(areaCount.count || 0)
      const talukMap: Record<string, number> = {}
      const categoryMap: Record<string, number> = {}
      for (const job of jobRows.data || []) {
        if (job.taluk) talukMap[job.taluk] = (talukMap[job.taluk] || 0) + 1
        const key = String(job.category || '').toLowerCase()
        categoryMap[key] = (categoryMap[key] || 0) + 1
      }
      setTalukCounts(talukMap)
      setCategories((categoryRows.data || []).map((category) => {
        const style = JOB_CATEGORY_STYLES[category.slug] || { detail: category.description || 'Explore local job openings', color: 'from-slate-500 to-slate-700', accentColor: '#475569' }
        return { ...style, name: category.name, slug: category.slug, detail: category.description || style.detail, count: `${categoryMap[category.name.toLowerCase()] || 0} published jobs` }
      }))
    }
    void loadJobs()
    return () => { alive = false }
  }, [])

  const districtTaluks = KOLAR_TALUKS.filter((name) => name !== 'All Taluks')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (keyword) p.set('q', keyword)
    if (taluk && taluk !== 'All Taluks') p.set('location', taluk)
    window.location.href = `/jobs?${p.toString()}`
  }

  // Filtered jobs according to tab
  const displayedJobs = jobs.filter(job => {
    if (activeTab === 'mfg') return job.category.toLowerCase().includes('manuf')
    if (activeTab === 'tech') return job.category.toLowerCase().includes('tech')
    if (activeTab === 'health') return job.category.toLowerCase().includes('health')
    return true
  })

  return (
    <main>
      {/* === HERO SECTION === */}
      <section className="hero">
        <div className="hero-ambient-mesh" />

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> KOLAR DISTRICT’S CAREER PLATFORM
            </span>

            <h1>
              Build Your Career Right Here in <span className="highlight-red">Kolar Region.</span>
            </h1>

            <p className="hero-description">
              Search local opportunities across the six taluks of Kolar district. Filter by job title, category and verified locality.
            </p>

            {/* Smart Multi-Field Search */}
            <div className="search-card-wrapper">
              <form className="hero-search-form" onSubmit={handleSearch}>
                <div className="search-field">
                  <Search size={18} style={{ color: 'var(--primary)' }} />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Job title, skill, or company (e.g. QA, Nurse, CNC)"
                  />
                </div>

                <div className="search-divider" />

                <div className="search-field">
                  <MapPin size={18} style={{ color: 'var(--primary)' }} />
                  <select
                    value={taluk}
                    onChange={(e) => setTaluk(e.target.value)}
                    aria-label="Select taluk"
                  >
                    {KOLAR_TALUKS.map((t) => (
                      <option key={t} value={t === 'All Taluks' ? '' : t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="button button-primary">
                  <Search size={16} /> Search
                </button>
              </form>
            </div>

            {/* Popular Quick Searches */}
            <div className="popular-tags">
              <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Popular:</span>
              {[
                'Manufacturing',
                'Technology',
                'Healthcare',
                'Nurse',
                'CNC Operator',
                'Fresher',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="popular-tag-btn"
                  onClick={() => {
                    window.location.href = `/jobs?${['Manufacturing', 'Technology', 'Healthcare'].includes(term) ? `category=${encodeURIComponent(term)}` : `q=${encodeURIComponent(term)}`}`
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Visual With AI Studio High-Res Imagery */}
          <div className="hero-visual-container">
            <div className="hero-image-frame">
              <img
                src="/images/hero-workforce.jpg"
                alt="Ambitious professionals and engineers in Kolar, Karnataka"
              />
            </div>

            {/* Floating Glass Badges */}
            <div className="floating-glass-pill pill-narasapura">
              <div className="pill-icon pill-icon-red">
                <Factory size={20} />
              </div>
              <div className="pill-content">
                <strong>Jobs across Kolar district</strong>
                <small>Search openings in all six district taluks</small>
              </div>
            </div>

            <div className="floating-glass-pill pill-verified">
              <div className="pill-icon pill-icon-blue">
                <ShieldCheck size={20} />
              </div>
              <div className="pill-content">
                <strong>Choose a local area</strong>
                <small>Job posts use verified Kolar localities</small>
              </div>
            </div>
          </div>
        </div>

        {/* Hero District Metrics */}
        <div className="hero-stats-row">
          <div className="stat-item">
            <div className="stat-icon-wrap">
              <Building2 size={24} />
            </div>
            <div>
              <div className="stat-number">{activeJobCount}</div>
              <div className="stat-label">Published job openings</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
              <Users2 size={24} />
            </div>
            <div>
              <div className="stat-number">{districtTaluks.length}</div>
              <div className="stat-label">Official Kolar district taluks</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <div className="stat-number">{verifiedAreaCount}</div>
              <div className="stat-label">Verified localities available</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ background: 'var(--emerald-light)', color: 'var(--emerald)' }}>
              <Award size={24} />
            </div>
            <div>
              <div className="stat-number">Kolar</div>
              <div className="stat-label">Local job marketplace</div>
            </div>
          </div>
        </div>
      </section>

      {/* === TALUK & INDUSTRIAL HUB SHOWCASE === */}
      <section className="section">
        <div className="section-header-flex">
          <div>
            <span className="eyebrow eyebrow-navy">
              <MapPin size={13} /> REGIONAL CORRIDORS
            </span>
            <h2>Explore jobs by district taluk</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15.5px' }}>
              Select one of Kolar district’s official taluks to see currently published local openings.
            </p>
          </div>
          <Link href="/jobs" className="button button-secondary button-sm">
            All Areas <ArrowRight size={14} />
          </Link>
        </div>

        <div className="taluk-grid">
          {districtTaluks.map((name, index) => {
            const images = ['/images/kolar-industry.jpg', '/images/kolar-tech.jpg', '/images/hero-workforce.jpg', '/images/kolar-manufacturing.jpg', '/images/kolar-tech.jpg', '/images/kolar-industry.jpg']
            return (
            <Link
              key={name}
              href={`/jobs?location=${encodeURIComponent(name)}`}
              className="taluk-card"
            >
              <img src={images[index]} alt={`${name} Taluk`} className="taluk-card-bg" />
              <div className="taluk-card-gradient" />
              <div className="taluk-card-content">
                <span className="taluk-pill">
                  <span className="pulse-dot" /> {talukCounts[name] || 0} published jobs
                </span>
                <h3 style={{ marginTop: '12px' }}>{name} Taluk</h3>
                <p>Local job opportunities</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fecdd3', fontWeight: 600 }}>
                  <span>Browse current roles</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </Link>
            )
          })}
        </div>
      </section>

      {/* === CATEGORIES GRID === */}
      <section className="section section-soft">
        <div className="section-header">
          <span className="eyebrow">
            <TrendingUp size={13} /> POPULAR DOMAINS
          </span>
          <h2>Explore Roles Across Every Field</h2>
          <p>
            Whether your background is engineering, healthcare, coding, or commerce, Kolar has thriving sectors waiting for you.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((cat, idx) => {
            const icons = [Factory, Laptop, HeartPulse, Truck, GraduationCap, Users2]
            const IconComponent = icons[idx % icons.length]

            return (
              <Link
                key={cat.name}
                href={`/jobs?category=${encodeURIComponent(cat.name.split(' ')[0])}`}
                className="category-card"
              >
                <div
                  className="category-card-icon"
                  style={{ background: cat.accentColor }}
                >
                  <IconComponent size={26} />
                </div>
                <h3>{cat.name}</h3>
                <p>{cat.detail}</p>
                <div className="category-card-footer">
              <span>{cat.count}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Roles <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* === FEATURED JOBS SECTION === */}
      <section className="section">
        <div className="section-header-flex">
          <div>
            <span className="eyebrow">
              <Briefcase size={13} /> FRESH OPENINGS
            </span>
            <h2>Latest published local jobs</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Job locations use the verified Kolar locality directory. Salary details are supplied by the employer.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`button button-sm ${activeTab === 'all' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              All Roles
            </button>
            <button
              className={`button button-sm ${activeTab === 'mfg' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('mfg')}
            >
              Manufacturing
            </button>
            <button
              className={`button button-sm ${activeTab === 'tech' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('tech')}
            >
              Tech & IT
            </button>
            <button
              className={`button button-sm ${activeTab === 'health' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('health')}
            >
              Healthcare
            </button>
          </div>
        </div>

        <div className="job-grid">
          {displayedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        {displayedJobs.length === 0 && <div className="empty-state">No published jobs are available yet. Check back after administrators approve new listings.</div>}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/jobs" className="button button-navy button-lg">
            Browse All {activeJobCount} Jobs in Kolar <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* === EMPLOYER BANNER (ROYAL INDIGO & SAPPHIRE - ZERO BLACK) === */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="employer-banner-wrap">
          <div className="employer-banner-content">
            <span className="eyebrow" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}>
              <Building2 size={13} /> FOR KOLAR EMPLOYERS & FACTORIES
            </span>

            <h2>
              Hiring in Kolar? Connect with Proven Local Talent.
            </h2>

            <p>
              Skip the long commute and high turnover. Reach dedicated professionals, skilled technicians, nurses, and engineers residing right in Kolar district.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/employers/post" className="button button-primary button-lg">
                Post a Job for Free <ArrowRight size={17} />
              </Link>
              <Link href="/about" className="button button-secondary button-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                Employer Guide
              </Link>
            </div>

            <div className="employer-perks-row">
              <div className="employer-perk-item">
                <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                <span>Verified Local Phone Contacts</span>
              </div>
              <div className="employer-perk-item">
                <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                <span>Instant Applicant Notifications</span>
              </div>
              <div className="employer-perk-item">
                <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                <span>Zero Commission Fees</span>
              </div>
            </div>
          </div>

          <div className="employer-banner-media">
            <img
              src="/images/employer-banner.jpg"
              alt="Hiring managers interviewing candidate in Kolar"
            />
            <div className="employer-media-overlay" />
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="section section-soft">
        <div className="section-header">
          <span className="eyebrow eyebrow-amber">
            <Sparkles size={13} /> SIMPLE & TRANSPARENT
          </span>
          <h2>How Jobs in Kolar Works For You</h2>
          <p>
            Whether searching for your dream job or building a high-performing team, getting started takes just a minute.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon-wrap">
              <Search size={28} />
            </div>
            <h3>Discover Verified Local Roles</h3>
            <p>
              Filter available openings by Kolar district taluk, verified locality, role and category.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">02</span>
            <div className="step-icon-wrap" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3>Apply in 1-Click</h3>
            <p>
              Apply to published local roles from your candidate profile and follow application updates in your dashboard.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon-wrap" style={{ background: 'var(--emerald-light)', color: 'var(--emerald)' }}>
              <Award size={28} />
            </div>
            <h3>Get Interviewed & Hired</h3>
            <p>
              Track application status directly in your dashboard, receive instant phone/email updates, and start working close to home.
            </p>
          </div>
        </div>
      </section>

      {/* === COMMUNITY CTA STRIP === */}
      <section className="section">
        <div
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #eff6ff 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: '24px',
            padding: '48px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="eyebrow">
              <Users2 size={13} /> CREATE A CANDIDATE PROFILE
            </span>
            <h2 style={{ fontSize: '32px', margin: '12px 0 8px' }}>
              Your Next Career Move in Kolar Starts Today.
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15.5px' }}>
              Create a free candidate profile to receive instant job recommendations and direct employer outreach.
            </p>
          </div>

          <Link href="/auth?mode=signup" className="button button-primary button-lg">
            Create Free Candidate Profile <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  )
}
