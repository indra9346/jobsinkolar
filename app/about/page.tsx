import Link from 'next/link'
import {
  MapPin,
  Factory,
  CheckCircle2,
  Users2,
  Building2,
  ShieldCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export const metadata = {
  title: 'About Jobs in Kolar | Empowering Local Careers',
  description: 'Learn how Jobs in Kolar connects local job seekers and employers across the district’s official taluks.',
}

export default function About() {
  return (
    <main className="page-shell">
      <div className="page-container">
        {/* Hero Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '48px', alignItems: 'center', marginBottom: '72px' }}>
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> ROOTED IN KOLAR DISTRICT
            </span>
            <h1 className="page-title" style={{ fontSize: '42px', margin: '14px 0 16px' }}>
              Meaningful Work Belongs Close to Home.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.65, marginBottom: '24px' }}>
              Jobs in Kolar connects candidates and employers through one district-focused job marketplace. Search roles by title, category, taluk, and verified locality, then manage applications from your account.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link className="button button-primary" href="/jobs">
                Browse Open Roles <ArrowRight size={15} />
              </Link>
              <Link className="button button-secondary" href="/employers/post">
                Post an Opening
              </Link>
            </div>
          </div>

          <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-light)' }}>
            <img
              src="/images/kolar-industry.jpg"
              alt="Work and business in Kolar district"
              style={{ width: '100%', height: '380px', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* District Corridors Highlights */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <span className="eyebrow eyebrow-navy">
              <Factory size={13} /> HOW THE PLATFORM WORKS
            </span>
            <h2 style={{ fontSize: '34px', margin: '14px 0 10px' }}>
              Local opportunities, organized clearly
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Job listings cover Kolar district. Taluk and locality choices come from the active region directory maintained in the database.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="panel" style={{ padding: '30px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <Factory size={24} />
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px' }}>Verified localities</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
                Job posts must select an active locality from the Kolar district directory, so the location filter stays consistent.
              </p>
            </div>

            <div className="panel" style={{ padding: '30px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px' }}>Administrator-reviewed jobs</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
                Employer-submitted jobs are held for review. Administrators can publish jobs directly and send matching alerts to subscribers.
              </p>
            </div>

            <div className="panel" style={{ padding: '30px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--amber-light)', color: 'var(--amber)', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <Building2 size={24} />
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px' }}>Private candidate profiles</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
                Only the candidate and authorized administrators can view a candidate profile. Administrators can update account and recruitment status, with changes recorded in profile history.
              </p>
            </div>
          </div>
        </section>

        {/* Our Guiding Principles */}
        <section style={{ marginBottom: '80px', background: '#ffffff', borderRadius: '24px', padding: '56px 44px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <span className="eyebrow eyebrow-amber">
                <ShieldCheck size={13} /> OUR PROMISE
              </span>
              <h2 style={{ fontSize: '32px', margin: '14px 0 16px' }}>
                Clear roles and private account data.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>Candidate accounts</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '2px 0 0' }}>Candidates can create a profile, apply to published jobs, and follow application updates in their dashboard.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>Employer job submissions</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '2px 0 0' }}>Employers can submit a role with its location and optional salary range for administrator review.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>Real-time updates</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '2px 0 0' }}>Candidates see their profile and application status updates in their account dashboard.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <img
                src="/images/kolar-tech.jpg"
                alt="Local workplace in Kolar district"
                style={{ width: '100%', height: '360px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section
          style={{
            background: 'var(--bg-banner)',
            borderRadius: '24px',
            padding: '52px 48px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '32px', margin: '0 0 10px' }}>Ready to Take the Next Step?</h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', margin: 0, maxWidth: '560px' }}>
              Browse local openings, create a candidate account, or submit an employer job for review.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <Link href="/auth?mode=signup" className="button button-primary button-lg">
              Sign Up as Candidate
            </Link>
            <Link href="/employers/post" className="button button-secondary button-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
              Post a Job Listing
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
