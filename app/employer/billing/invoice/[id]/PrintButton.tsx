'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-outline btn-sm">
      <Printer size={15} /> Print or save as PDF
    </button>
  )
}
