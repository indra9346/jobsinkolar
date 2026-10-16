'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { PageHeader, Spinner } from '@/components/ui/bits'
import { SITE } from '@/lib/constants'

export function AccountSettings({ email, candidate }: { email: string; candidate?: { id: string; talent_visible: boolean; open_to_work: boolean } }) {
  const toast = useToast()
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [vis, setVis] = useState(candidate)

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8 || !/\d/.test(pw)) return toast('Use at least 8 characters, with a number', 'error')
    if (pw !== pw2) return toast('Passwords do not match', 'error')
    setBusy(true)
    const { error } = await getSupabase().auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setPw('')
    setPw2('')
    toast('Password updated')
  }

  const toggle = async (k: 'talent_visible' | 'open_to_work', v: boolean) => {
    if (!vis) return
    setVis({ ...vis, [k]: v })
    const { error } = await getSupabase().from('profiles').update({ [k]: v }).eq('id', vis.id)
    if (error) {
      setVis({ ...vis })
      return toast(error.message, 'error')
    }
    toast('Saved')
    router.refresh()
  }

  const signOutAll = async () => {
    await getSupabase().auth.signOut({ scope: 'global' })
    window.location.assign('/login')
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-3xl gap-5">
        {vis && (
          <section className="card divide-y divide-line-2">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Privacy</h2>
            </div>
            {(
              [
                ['talent_visible', 'Show my profile in the candidate database', 'Verified employers can find you. Your phone, email and documents stay hidden until they unlock your profile.'],
                ['open_to_work', 'I am actively looking for a job', 'Profiles that are open to work appear first in employer searches.'],
              ] as const
            ).map(([k, t, d]) => (
              <label key={k} className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4">
                <span>
                  <span className="block text-sm font-medium">{t}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-3">{d}</span>
                </span>
                <input type="checkbox" role="switch" checked={vis[k]} onChange={(e) => toggle(k, e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-navy-600)]" />
              </label>
            ))}
          </section>
        )}

        <section className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Sign-in</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">Signed in as {email}</p>
          </div>
          <form onSubmit={changePw} className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="pw">New password</label>
              <input id="pw" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="pw2">Confirm password</label>
              <input id="pw2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button className="btn btn-navy" disabled={busy || !pw}>{busy ? <Spinner /> : 'Update password'}</button>
              <button type="button" onClick={signOutAll} className="btn btn-outline">Sign out of all devices</button>
            </div>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Delete account</h2>
          <p className="mt-1 text-sm text-ink-3">
            We remove your profile, applications and documents within 7 days of a request. Email{' '}
            <a className="link" href={`mailto:${SITE.email}?subject=${encodeURIComponent('Delete my account')}&body=${encodeURIComponent(`Please delete the account registered with ${email}.`)}`}>
              {SITE.email}
            </a>{' '}
            from your registered address.
          </p>
        </section>
      </div>
    </>
  )
}
