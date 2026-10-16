'use client'

import { Download } from 'lucide-react'

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    // Neutralise spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\r\n')
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportCsv({ rows, filename, label = 'Download CSV', onDone }: { rows: Record<string, unknown>[]; filename: string; label?: string; onDone?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        downloadCsv(rows, filename)
        onDone?.()
      }}
      disabled={!rows.length}
      className="btn btn-outline btn-sm self-start"
    >
      <Download size={15} /> {label}
    </button>
  )
}
