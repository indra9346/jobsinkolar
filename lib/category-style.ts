import { BriefcaseBusiness, Cpu, Factory, GraduationCap, HeartPulse, Hotel, ShoppingBag, Sparkles, Truck, Landmark, Wrench, Wheat, type LucideIcon } from 'lucide-react'

type Style = { icon: LucideIcon; tile: string; icon_bg: string; kn: string }

// Each category gets a consistent colour + icon across the site.
const MAP: Record<string, Style> = {
  manufacturing: { icon: Factory, tile: 'from-orange-50 to-white hover:border-orange-200', icon_bg: 'bg-gradient-to-br from-orange-400 to-rose-500', kn: 'ಉತ್ಪಾದನೆ' },
  technology: { icon: Cpu, tile: 'from-sky-50 to-white hover:border-sky-200', icon_bg: 'bg-gradient-to-br from-sky-400 to-indigo-500', kn: 'ತಂತ್ರಜ್ಞಾನ' },
  healthcare: { icon: HeartPulse, tile: 'from-emerald-50 to-white hover:border-emerald-200', icon_bg: 'bg-gradient-to-br from-emerald-400 to-teal-600', kn: 'ಆರೋಗ್ಯ' },
  education: { icon: GraduationCap, tile: 'from-violet-50 to-white hover:border-violet-200', icon_bg: 'bg-gradient-to-br from-violet-400 to-purple-600', kn: 'ಶಿಕ್ಷಣ' },
  sales: { icon: ShoppingBag, tile: 'from-pink-50 to-white hover:border-pink-200', icon_bg: 'bg-gradient-to-br from-pink-400 to-rose-600', kn: 'ಮಾರಾಟ' },
  hospitality: { icon: Hotel, tile: 'from-amber-50 to-white hover:border-amber-200', icon_bg: 'bg-gradient-to-br from-amber-400 to-orange-500', kn: 'ಆತಿಥ್ಯ' },
  'women-friendly': { icon: Sparkles, tile: 'from-fuchsia-50 to-white hover:border-fuchsia-200', icon_bg: 'bg-gradient-to-br from-fuchsia-400 to-pink-600', kn: 'ಮಹಿಳಾ ಸ್ನೇಹಿ' },
  logistics: { icon: Truck, tile: 'from-cyan-50 to-white hover:border-cyan-200', icon_bg: 'bg-gradient-to-br from-cyan-400 to-blue-600', kn: 'ಸಾರಿಗೆ' },
  finance: { icon: Landmark, tile: 'from-indigo-50 to-white hover:border-indigo-200', icon_bg: 'bg-gradient-to-br from-indigo-400 to-navy-600', kn: 'ಹಣಕಾಸು' },
  trades: { icon: Wrench, tile: 'from-slate-50 to-white hover:border-slate-300', icon_bg: 'bg-gradient-to-br from-slate-500 to-slate-700', kn: 'ಕುಶಲಕರ್ಮಿ' },
  agriculture: { icon: Wheat, tile: 'from-lime-50 to-white hover:border-lime-200', icon_bg: 'bg-gradient-to-br from-lime-500 to-green-600', kn: 'ಕೃಷಿ' },
}

const FALLBACK: Style = { icon: BriefcaseBusiness, tile: 'from-navy-50 to-white hover:border-navy-200', icon_bg: 'bg-gradient-to-br from-navy-400 to-navy-700', kn: '' }

export function categoryStyle(nameOrSlug: string): Style {
  const key = nameOrSlug.toLowerCase().replace(/\s+/g, '-')
  return MAP[key] ?? Object.entries(MAP).find(([k]) => key.includes(k.split('-')[0]))?.[1] ?? FALLBACK
}
