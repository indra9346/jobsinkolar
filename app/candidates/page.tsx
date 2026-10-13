'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  Filter,
  CheckCircle2,
  Sparkles,
  Send,
  X,
  Phone,
  Mail,
  Building2,
  ArrowRight
} from 'lucide-react'
import { Candidate, CANDIDATE_TALENT_POOL } from '@/lib/candidates-data'
import { CandidateCard } from '@/components/CandidateCard'
import { KOLAR_TALUKS } from '@/lib/jobs-data'

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaluk, setSelectedTaluk] = useState('All Taluks')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [onlyImmediate, setOnlyImmediate] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  const filteredCandidates = useMemo(() => {
    return CANDIDATE_TALENT_POOL.filter((c) => {
      // Search text match
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        c.fullName.toLowerCase().includes(query) ||
        c.roleTitle.toLowerCase().includes(query) ||
        c.locality.toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query)) ||
        c.education.toLowerCase().includes(query)

      // Taluk filter
      const matchesTaluk =
        selectedTaluk === 'All Taluks' ||
        c.taluk.toLowerCase().includes(selectedTaluk.toLowerCase())

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || c.category === selectedCategory

      // Immediate joiner filter
      const matchesImmediate = !onlyImmediate || c.availableImmediately

      return matchesSearch && matchesTaluk && matchesCategory && matchesImmediate
    })
  }, [searchQuery, selectedTaluk, selectedCategory, onlyImmediate])

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteSuccess(true)
    setTimeout(() => {
      // Auto close after 2.5s
      setTimeout(() => {
        setSelectedCandidate(null)
        setInviteSuccess(false)
        setCompanyName('')
        setJobTitle('')
        setInviteMessage('')
      }, 2000)
    }, 400)
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        {/* Hero Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%)',
            borderRadius: '24px',
            padding: '48px 36px',
            color: '#ffffff',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '36px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ maxWidth: '720px', position: 'relative', zIndex: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(244, 63, 94, 0.25)',
                color: '#fecdd3',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid rgba(244, 63, 94, 0.4)',
                marginBottom: '16px'
              }}
            >
              <Sparkles size={14} /> VERIFIED TALENT POOL
            </span>
            <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>
              Hire Verified Local Talent in Kolar District
            </h1>
            <p style={{ fontSize: '16px', color: '#cbd5e1', margin: 0, lineHeight: 1.65 }}>
              Connect directly with qualified machinists in Narasapura, tech engineers in Vemagal, nurses in Kolar Town, and logistics leaders in Malur. No agency markups.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by skill, role, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: '#f8fafc',
                  fontSize: '14px',
                  color: 'var(--text-heading)'
                }}
              />
            </div>

            {/* Taluk Selector */}
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                value={selectedTaluk}
                onChange={(e) => setSelectedTaluk(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: '#f8fafc',
                  fontSize: '14px',
                  color: 'var(--text-heading)',
                  cursor: 'pointer'
                }}
              >
                {KOLAR_TALUKS.map((taluk) => (
                  <option key={taluk} value={taluk}>
                    {taluk}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: '#f8fafc',
                  fontSize: '14px',
                  color: 'var(--text-heading)',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Industries</option>
                <option value="manufacturing">Manufacturing & Auto</option>
                <option value="technology">Technology & IT</option>
                <option value="healthcare">Healthcare & Nursing</option>
                <option value="logistics">Logistics & Supply Chain</option>
                <option value="finance">Finance & Accounts</option>
              </select>
            </div>
          </div>

          {/* Secondary Quick Toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={onlyImmediate}
                onChange={(e) => setOnlyImmediate(e.target.checked)}
                style={{ accentColor: '#e11d48', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Show only candidates ready to join immediately
            </label>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredCandidates.length}</strong> verified candidates across Kolar
            </span>
          </div>
        </div>

        {/* Candidate Grid */}
        {filteredCandidates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {filteredCandidates.map((cand) => (
              <CandidateCard
                key={cand.id}
                candidate={cand}
                onContact={(candidate) => setSelectedCandidate(candidate)}
              />
            ))}
          </div>
        ) : (
          <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: '48px' }}>
            <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>No candidates found matching your criteria</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px' }}>
              Try broadening your taluk filter or searching for a different skill set.
            </p>
            <button
              className="button button-secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedTaluk('All Taluks')
                setSelectedCategory('all')
                setOnlyImmediate(false)
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Jobseeker Join Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
            borderRadius: '24px',
            border: '1px solid #bfdbfe',
            padding: '36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: '#1d4ed8' }}>
              LOOKING FOR WORK IN KOLAR?
            </span>
            <h2 style={{ fontSize: '24px', margin: '8px 0 6px', color: '#1e1b4b' }}>
              Get Discovered by 120+ Verified Local Employers
            </h2>
            <p style={{ color: '#475569', margin: 0, fontSize: '14.5px' }}>
              Create your candidate profile, highlight your skills in Kolar district, and receive direct interview calls.
            </p>
          </div>
          <Link href="/auth?mode=signup" className="button button-primary">
            Create Candidate Profile <ArrowRight size={15} />
          </Link>
        </div>

        {/* Invite to Interview Modal */}
        {selectedCandidate && (
          <div className="area-modal-backdrop" role="presentation" onClick={() => setSelectedCandidate(null)}>
            <div className="area-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <button className="area-close" onClick={() => setSelectedCandidate(null)} aria-label="Close">
                ×
              </button>

              <span className="eyebrow">
                <Send size={13} /> INTERVIEW INVITATION
              </span>
              <h2 style={{ fontSize: '22px', margin: '12px 0 4px' }}>
                Invite {selectedCandidate.fullName}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '18px' }}>
                {selectedCandidate.roleTitle} · {selectedCandidate.locality}, {selectedCandidate.taluk}
              </p>

              {inviteSuccess ? (
                <div className="form-message success" role="status">
                  <CheckCircle2 size={16} />
                  <span>
                    Interview invitation sent to {selectedCandidate.fullName}! They will receive notification details shortly.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSendInvite}>
                  <label className="field">
                    Your Company / Business Name
                    <input
                      required
                      placeholder="e.g. Scania Supplier / SNR Health Clinic"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    Position You are Hiring For
                    <input
                      required
                      placeholder="e.g. Senior CNC Technician (Narasapura)"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    Message / Preferred Interview Timing
                    <textarea
                      rows={3}
                      placeholder="Hi, we reviewed your profile on Jobs in Kolar. We would like to invite you for an initial interview..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="button button-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    Send Interview Invitation
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
