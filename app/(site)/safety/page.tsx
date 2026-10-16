import type { Metadata } from 'next'
import Link from 'next/link'
import { ProsePage } from '@/components/site/Prose'

export const metadata: Metadata = { title: 'Job search safety' }

export default function SafetyPage() {
  return (
    <ProsePage title="Stay safe while job hunting" intro="Most employers on Jobs in Kolar are genuine. These simple checks protect you from the few who aren’t.">
      <h2>Never pay to get a job</h2>
      <p>No genuine employer asks for registration fees, training fees or deposits before you join. If a job post declares a fee, we show a warning on it — read the reason carefully and never pay before you have a written offer.</p>
      <h2>Check the employer</h2>
      <ul>
        <li>Look for the verified badge next to the company name.</li>
        <li>Visit the company page and see their other jobs.</li>
        <li>Be cautious if the salary looks far higher than similar jobs.</li>
      </ul>
      <h2>Protect your documents</h2>
      <ul>
        <li>Mask the first eight digits of your Aadhaar before uploading or sharing it.</li>
        <li>Never share OTPs, bank PINs or passwords with anyone.</li>
      </ul>
      <h2>Go to interviews safely</h2>
      <ul>
        <li>Interviews should be at an office, factory or other public place during working hours.</li>
        <li>Tell a family member where you are going.</li>
      </ul>
      <h2>Report anything suspicious</h2>
      <p>Use “Report this job” on any job page or <Link href="/contact?topic=report" className="link">contact us</Link>. We review every report and remove fraudulent employers.</p>
    </ProsePage>
  )
}
