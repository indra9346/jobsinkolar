'use client'

import React from 'react'
import {
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

export type ApplicationStage =
  | 'applied'
  | 'reviewing'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'interview_scheduled'
  | 'offered'
  | 'hired'
  | 'selected'
  | 'rejected'
  | 'withdrawn'
  | 'published'
  | 'pending_review'
  | 'draft'
  | 'closed'

interface StatusBadgeProps {
  status: ApplicationStage | string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

interface StatusConfig {
  label: string
  bg: string
  text: string
  border: string
  icon: React.ReactNode
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_')

  const badgeMap: Record<string, StatusConfig> = {
    applied: {
      label: 'Applied',
      bg: '#eff6ff',
      text: '#1d4ed8',
      border: '#bfdbfe',
      icon: <Clock size={size === 'sm' ? 12 : 14} style={{ color: '#2563eb' }} />
    },
    reviewing: {
      label: 'Under Review',
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
      icon: <Clock size={size === 'sm' ? 12 : 14} style={{ color: '#16a34a' }} />
    },
    under_review: {
      label: 'Under Review',
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
      icon: <Clock size={size === 'sm' ? 12 : 14} style={{ color: '#16a34a' }} />
    },
    shortlisted: {
      label: 'Shortlisted',
      bg: '#fff1f2',
      text: '#e11d48',
      border: '#fecdd3',
      icon: <Award size={size === 'sm' ? 12 : 14} style={{ color: '#e11d48' }} />
    },
    interview: {
      label: 'Interview Scheduled',
      bg: '#faf5ff',
      text: '#7e22ce',
      border: '#e9d5ff',
      icon: <UserCheck size={size === 'sm' ? 12 : 14} style={{ color: '#9333ea' }} />
    },
    interview_scheduled: {
      label: 'Interview Scheduled',
      bg: '#faf5ff',
      text: '#7e22ce',
      border: '#e9d5ff',
      icon: <UserCheck size={size === 'sm' ? 12 : 14} style={{ color: '#9333ea' }} />
    },
    offered: {
      label: 'Offer Extended',
      bg: '#f0fdf4',
      text: '#166534',
      border: '#86efac',
      icon: <Sparkles size={size === 'sm' ? 12 : 14} style={{ color: '#16a34a' }} />
    },
    hired: {
      label: 'Selected & Hired',
      bg: '#ecfdf5',
      text: '#047857',
      border: '#6ee7b7',
      icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} style={{ color: '#059669' }} />
    },
    selected: {
      label: 'Selected & Hired',
      bg: '#ecfdf5',
      text: '#047857',
      border: '#6ee7b7',
      icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} style={{ color: '#059669' }} />
    },
    rejected: {
      label: 'Not Selected',
      bg: '#f8fafc',
      text: '#64748b',
      border: '#e2e8f0',
      icon: <XCircle size={size === 'sm' ? 12 : 14} style={{ color: '#94a3b8' }} />
    },
    withdrawn: {
      label: 'Withdrawn',
      bg: '#f8fafc',
      text: '#64748b',
      border: '#e2e8f0',
      icon: <AlertCircle size={size === 'sm' ? 12 : 14} style={{ color: '#94a3b8' }} />
    },
    published: {
      label: 'Active & Verified',
      bg: '#ecfdf5',
      text: '#047857',
      border: '#a7f3d0',
      icon: <ShieldCheck size={size === 'sm' ? 12 : 14} style={{ color: '#059669' }} />
    },
    pending_review: {
      label: 'Pending Approval',
      bg: '#fffbeb',
      text: '#b45309',
      border: '#fde68a',
      icon: <Clock size={size === 'sm' ? 12 : 14} style={{ color: '#d97706' }} />
    },
    draft: {
      label: 'Draft',
      bg: '#f8fafc',
      text: '#475569',
      border: '#cbd5e1',
      icon: <Clock size={size === 'sm' ? 12 : 14} style={{ color: '#64748b' }} />
    },
    closed: {
      label: 'Listing Closed',
      bg: '#f8fafc',
      text: '#64748b',
      border: '#e2e8f0',
      icon: <XCircle size={size === 'sm' ? 12 : 14} style={{ color: '#94a3b8' }} />
    }
  }

  const badge = badgeMap[normalized] || {
    label: status.replace(/_/g, ' '),
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
    icon: <Clock size={size === 'sm' ? 12 : 14} />
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 600,
        backgroundColor: badge.bg,
        color: badge.text,
        border: `1px solid ${badge.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.3
      }}
    >
      {showIcon && badge.icon}
      <span>{badge.label}</span>
    </span>
  )
}
