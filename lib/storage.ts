export function logoUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`
}

export function safeFileName(name: string) {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^\w.-]+/g, '_').slice(0, 60)
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^.\w]/g, '') : ''
  return `${base}${ext}`
}
