import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/Prose'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Terms of use' }

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" updated="16 October 2026" intro="By creating an account or using Jobs in Kolar you agree to these terms.">
      <h2>For job seekers</h2>
      <ul>
        <li>Using Jobs in Kolar is free. Provide accurate information in your profile and documents.</li>
        <li>Employers make their own hiring decisions. We do not guarantee interviews or jobs.</li>
        <li>Never pay anyone to get a job. Report any such request to us.</li>
      </ul>
      <h2>For employers</h2>
      <ul>
        <li>Post only real vacancies at your own company or a client you are authorised to hire for. Job posts must state an honest salary range.</li>
        <li>Any fee or deposit charged to candidates must be declared in the job post. Undeclared fees lead to permanent removal without refund.</li>
        <li>Use candidate data only to recruit for the role. Do not share, sell or use it for marketing.</li>
        <li>We may reject, edit for formatting, or close any job post that breaks these rules.</li>
      </ul>
      <h2>Credits and payments</h2>
      <ul>
        <li>Plan prices are shown before GST. Credits are added once the payment is confirmed by Razorpay.</li>
        <li>A job credit is used when a job is first submitted for review. Editing and resubmitting a rejected job is free.</li>
        <li>Paid credits are valid for the plan period. Unused credits are not refundable except where required by law.</li>
      </ul>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your password safe. We may suspend accounts that post fraudulent jobs, harass users, or misuse data.</p>
      <h2>Liability</h2>
      <p>Jobs in Kolar is a platform that connects employers and candidates. We are not a party to employment agreements and are not liable for the conduct of users, to the extent permitted by law.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a className="link" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </ProsePage>
  )
}
