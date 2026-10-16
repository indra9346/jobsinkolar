import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/Prose'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Privacy policy' }

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" updated="16 October 2026" intro="This policy explains what we collect, why, who can see it and the choices you have. It is written to meet India’s Digital Personal Data Protection Act, 2023.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, email, mobile number and password (stored only as a secure hash by our authentication provider).</li>
        <li><strong>Candidate profile:</strong> role, experience, education, skills, languages, location, job preferences, resume and any documents you upload.</li>
        <li><strong>Employer details:</strong> company name, address, contact person, GSTIN and billing information.</li>
        <li><strong>Activity:</strong> applications, messages between employers and candidates, saved jobs and job alert preferences.</li>
      </ul>
      <h2>Who can see your information</h2>
      <ul>
        <li>Employers see your profile, resume and contact details only when you apply to their job, or when a verified employer unlocks your profile from the candidate database. You can hide your profile from the database at any time in Settings.</li>
        <li>Documents you upload are stored privately. They are visible to our verification team and to employers who can see your contact details as described above.</li>
        <li>Company profiles and job posts are public. GSTIN, billing address and contact details of employers are never public.</li>
        <li>We do not sell personal data.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>To run the job board: matching candidates to jobs, sending notifications and job alerts you asked for, preventing fraud, verifying employers and documents, processing payments and issuing GST invoices.</p>
      <h2>Service providers</h2>
      <p>We use Supabase for hosting and authentication, Razorpay for payments and an email provider for job alerts. They process data only on our instructions.</p>
      <h2>Retention</h2>
      <p>We keep your account while it is active. When you ask us to delete it, we remove your profile, applications and documents within 7 days, except records we must keep by law (such as tax invoices).</p>
      <h2>Your rights</h2>
      <p>You can view and edit your data in your dashboard, download your resume and documents, withdraw consent for job alerts with one click, and request deletion. Write to <a className="link" href={`mailto:${SITE.email}`}>{SITE.email}</a> for any privacy request or grievance.</p>
    </ProsePage>
  )
}
