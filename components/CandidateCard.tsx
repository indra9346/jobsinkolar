'use client'

import React from 'react'
import {
  MapPin,
  Briefcase,
  ShieldCheck,
  IndianRupee,
  GraduationCap,
  Sparkles,
  Send,
  CheckCircle2
} from 'lucide-react'
import { Candidate } from '@/lib/candidates-data'

interface CandidateCardProps {
  candidate: Candidate
  onContact?: (candidate: Candidate) => void
}

export function CandidateCard({ candidate, onContact }: CandidateCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-card)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
        e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.borderColor = 'var(--border-light)'
      }}
    >
      <div>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${candidate.badgeColor} 0%, #1e3a8a 100%)`,
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(30, 27, 75, 0.15)',
                flexShrink: 0
              }}
            >
              {candidate.initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {candidate.fullName}
                </h3>
                {candidate.verified && (
                  <span title="Verified Kolar Resident & Credentialed Candidate" style={{ display: 'inline-flex' }}>
                    <ShieldCheck size={18} style={{ color: '#059669' }} />
                  </span>
                )}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: candidate.badgeColor,
                  marginTop: '2px'
                }}
              >
                {candidate.categoryLabel}
              </span>
            </div>
          </div>

          {candidate.availableImmediately && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={12} /> Ready to Join
            </span>
          )}
        </div>

        {/* Role Title */}
        <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.4 }}>
          {candidate.roleTitle}
        </p>

        {/* Locality & Meta pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <span className="job-pill" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
            <MapPin size={13} style={{ color: '#e11d48' }} /> {candidate.locality}, {candidate.taluk}
          </span>
          <span className="job-pill" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
            <Briefcase size={13} style={{ color: '#2563eb' }} /> {candidate.experienceYears} Years Exp
          </span>
          <span className="job-pill" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
            <IndianRupee size={13} style={{ color: '#059669' }} /> {candidate.expectedSalary}
          </span>
        </div>

        {/* Education */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          <GraduationCap size={15} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidate.education}
          </span>
        </div>

        {/* Bio summary */}
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {candidate.bio}
        </p>

        {/* Skills Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {candidate.skills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#334155',
                fontWeight: 500
              }}
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 4 && (
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: 'var(--text-muted)'
              }}
            >
              +{candidate.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Verified Local Resident
        </span>
        <button
          type="button"
          className="button button-primary button-sm"
          onClick={() => onContact && onContact(candidate)}
          style={{ padding: '8px 16px' }}
        >
          <Send size={14} /> Invite to Interview
        </button>
      </div>
    </div>
  )
}
