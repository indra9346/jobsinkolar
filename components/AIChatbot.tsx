'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  MapPin,
  Briefcase,
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export type Lang = 'en' | 'kn'

export interface ChatMessage {
  id: string
  sender: 'assistant' | 'user'
  text: string
  timestamp: string
  options?: string[]
  actionLink?: { text: string; url: string }
}

const WELCOME_EN: ChatMessage = {
  id: 'welcome-en',
  sender: 'assistant',
  text: `Hello! 👋 I am your **Jobs in Kolar Career Assistant**.\n\nI can help you find verified openings in **Narasapura auto hub**, **Vemagal tech park**, **SNR Hospital Kolar**, check local salary benchmarks, or guide you through posting a role as an employer.`,
  timestamp: 'Just now',
  options: [
    '🏭 Narasapura Industrial jobs & company buses',
    '💻 Vemagal tech & electronics openings',
    '🏥 Nursing & hospital vacancies in Kolar',
    '💰 Salary benchmarks in Kolar District',
    '🏢 How do employers post job vacancies?',
  ],
}

const WELCOME_KN: ChatMessage = {
  id: 'welcome-kn',
  sender: 'assistant',
  text: `ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ **Jobs in Kolar ವೃತ್ತಿ ಸಲಹೆಗಾರ ಸಹಾಯಕ**.\n\n**ನರಸಾಪುರ ಆಟೋಮೊಬೈಲ್ ಹಬ್**, **ವೇಮಗಲ್ ಟೆಕ್ ಪಾರ್ಕ್**, **ಕೋಲಾರದ ಆಸ್ಪತ್ರೆಗಳು** ಮತ್ತು **ಮಾಲೂರು ಲಾಜಿಸ್ಟಿಕ್ಸ್** ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು, ವೇತನ ಮಾಹಿತಿ ಪಡೆಯಲು ಅಥವಾ ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`,
  timestamp: 'ಇದೀಗ',
  options: [
    '🏭 ನರಸಾಪುರ ಕೈಗಾರಿಕಾ ಉದ್ಯೋಗಗಳು ಮತ್ತು ಕಂಪನಿ ಬಸ್ಸುಗಳು',
    '💻 ವೇಮಗಲ್ ಸಾಫ್ಟ್‌ವೇರ್ ಮತ್ತು ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಉದ್ಯೋಗಗಳು',
    '🏥 ಕೋಲಾರದಲ್ಲಿ ನರ್ಸಿಂಗ್ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಹುದ್ದೆಗಳು',
    '💰 ಕೋಲಾರ ಜಿಲ್ಲೆಯಲ್ಲಿ ಸರಾಸರಿ ವೇತನ ಶ್ರೇಣಿ',
    '🏢 ಕಂಪನಿಗಳು ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡುವುದು ಹೇಗೆ?',
  ],
}

interface QAItem {
  keywords: string[]
  answerEn: string
  answerKn: string
  actionLinkEn?: { text: string; url: string }
  actionLinkKn?: { text: string; url: string }
  optionsEn?: string[]
  optionsKn?: string[]
}

const KNOWLEDGE_BASE: QAItem[] = [
  {
    keywords: ['narasapura', 'mfg', 'manufacturing', 'auto', 'honda', 'scania', 'mahindra', 'factory', 'plant', 'ನರಸಾಪುರ', 'ಕಾರ್ಖಾನೆ', 'ಹೋಂಡಾ'],
    answerEn: `🏭 **Narasapura Industrial Hub Opportunities**\n\n• **Key Plants**: Honda 2-Wheelers, Scania Commercial Vehicles, Mahindra Aerospace, and 120+ tier-1 automotive ancillaries.\n• **Roles**: Quality Assurance, CNC/VMC Machinists, Assembly Line Technicians, Warehouse Supervisors, and Tool Room Engineers.\n• **Salary Range**: ₹18,000 to ₹48,000 / month with PF, ESI, and subsidized canteen.\n• **Transit**: Most plants provide subsidized company bus transit across Kolar, Bangarapet, and Malur.`,
    answerKn: `🏭 **ನರಸಾಪುರ ಕೈಗಾರಿಕಾ ಹಬ್ ಉದ್ಯೋಗಗಳು**\n\n• **ಪ್ರಮುಖ ಸಂಸ್ಥೆಗಳು**: ಹೋಂಡಾ ಮೋಟಾರ್ಸ್, ಸ್ಕ್ಯಾನಿಯಾ ವಾಹನಗಳು, ಮಹೀಂದ್ರಾ ಏರೋಸ್ಪೇಸ್ ಮತ್ತು 120 ಕ್ಕೂ ಹೆಚ್ಚು ಆಟೋ ಪೂರಕ ಘಟಕಗಳು.\n• **ಹುದ್ದೆಗಳು**: ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ (QA), CNC ಆಪರೇಟರ್, ಅಸೆಂಬ್ಲಿ ಲೈನ್ ಟೆಕ್ನಿಷಿಯನ್ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಮೇಲ್ವಿಚಾರಕರು.\n• **ವೇತನ ಶ್ರೇಣಿ**: ತಿಂಗಳಿಗೆ ₹18,000 ರಿಂದ ₹48,000 (PF, ESI ಮತ್ತು ಕ್ಯಾಂಟೀನ್ ಸೌಲಭ್ಯ ಸೇರಿ).\n• **ಸಾರಿಗೆ**: ಕೋಲಾರ, ಬಂಗಾರಪೇಟೆ ಮತ್ತು ಮಾಲೂರಿನಿಂದ ಸಬ್ಸಿಡಿ ಬಸ್ ಸೌಲಭ್ಯ ಲಭ್ಯವಿದೆ.`,
    actionLinkEn: { text: 'Browse Narasapura Jobs', url: '/jobs?location=Narasapura' },
    actionLinkKn: { text: 'ನರಸಾಪುರ ಉದ್ಯೋಗಗಳನ್ನು ವೀಕ್ಷಿಸಿ', url: '/jobs?location=Narasapura' },
    optionsEn: ['What are typical engineering salaries?', 'How to apply in 1-click?'],
    optionsKn: ['ಇಂಜಿನಿಯರಿಂಗ್ ವೇತನ ಎಷ್ಟಿರುತ್ತದೆ?', '1-ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?'],
  },
  {
    keywords: ['vemagal', 'tech', 'software', 'iot', 'robotics', 'electronics', 'ವೇಮಗಲ್', 'ಸಾಫ್ಟ್‌ವೇರ್', 'ಐಟಿ'],
    answerEn: `💻 **Vemagal Tech & Hardware Zone**\n\n• **Sector**: Emerging hub for industrial IoT, embedded firmware, hardware robotics, and electronic component manufacturing.\n• **Open Roles**: Embedded C/C++ Developers, Electronic Circuit Test Engineers, PCB Assembly Technicians, and Technical Support.\n• **Salary Range**: ₹25,000 to ₹65,000 / month for engineers and developers.`,
    answerKn: `💻 **ವೇಮಗಲ್ ಟೆಕ್ ಮತ್ತು ಹಾರ್ಡ್‌ವೇರ್ ವಲಯ**\n\n• **ಕ್ಷೇತ್ರ**: ಕೈಗಾರಿಕಾ IoT, ಎಂಬೆಡೆಡ್ ಸಿಸ್ಟಮ್ಸ್, ಹಾರ್ಡ್‌ವೇರ್ ರೋಬೋಟಿಕ್ಸ್ ಮತ್ತು ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಘಟಕಗಳ ಹಬ್.\n• **ಹುದ್ದೆಗಳು**: ಎಂಬೆಡೆಡ್ ಡೆವಲಪರ್, ಸರ್ಕ್ಯೂಟ್ ಟೆಸ್ಟ್ ಇಂಜಿನಿಯರ್, PCB ಅಸೆಂಬ್ಲರ್ ಮತ್ತು ಟೆಕ್ ಸಪೋರ್ಟ್.\n• **ವೇತನ ಶ್ರೇಣಿ**: ಇಂಜಿನಿಯರ್‌ಗಳಿಗೆ ತಿಂಗಳಿಗೆ ₹25,000 ರಿಂದ ₹65,000.`,
    actionLinkEn: { text: 'View Vemagal Tech Jobs', url: '/jobs?category=Technology' },
    actionLinkKn: { text: 'ವೇಮಗಲ್ ಉದ್ಯೋಗಗಳನ್ನು ವೀಕ್ಷಿಸಿ', url: '/jobs?category=Technology' },
    optionsEn: ['Narasapura Industrial jobs', 'Upload my resume'],
    optionsKn: ['ನರಸಾಪುರ ಕೈಗಾರಿಕಾ ಉದ್ಯೋಗಗಳು', 'ರೆಸ್ಯೂಮೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ'],
  },
  {
    keywords: ['hospital', 'nurse', 'nursing', 'medical', 'doctor', 'clinic', 'snr', 'healthcare', 'ಆಸ್ಪತ್ರೆ', 'ನರ್ಸ್', 'ವೈದ್ಯಕೀಯ'],
    answerEn: `🏥 **Healthcare & Nursing Roles in Kolar**\n\n• **Institutions**: SNR District Hospital, RL Jalappa Hospital & Medical College, and specialized clinics in Gulpet & Kolar Town.\n• **Roles**: Staff Nurse (GNM / B.Sc), ICU Specialists, Lab Technicians, Pharmacists, and Patient Care Coordinators.\n• **Salary Range**: ₹20,000 to ₹40,000 / month with medical insurance and hostel/housing support.`,
    answerKn: `🏥 **ಕೋಲಾರದಲ್ಲಿ ಆರೋಗ್ಯ ಮತ್ತು ನರ್ಸಿಂಗ್ ಉದ್ಯೋಗಗಳು**\n\n• **ಸಂಸ್ಥೆಗಳು**: SNR ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ, ಆರ್.ಎಲ್. ಜಾಲಪ್ಪ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಸ್ಥಳೀಯ ಕ್ಲಿನಿಕ್‌ಗಳು.\n• **ಹುದ್ದೆಗಳು**: ಸ್ಟಾಫ್ ನರ್ಸ್ (GNM/B.Sc), ICU ಸ್ಪೆಷಲಿಸ್ಟ್, ಲ್ಯಾಬ್ ಟೆಕ್ನಿಷಿಯನ್ ಮತ್ತು ಫಾರ್ಮಸಿಸ್ಟ್.\n• **ವೇತನ ಶ್ರೇಣಿ**: ತಿಂಗಳಿಗೆ ₹20,000 ರಿಂದ ₹40,000 (ವೈದ್ಯಕೀಯ ವಿಮೆ ಮತ್ತು ವಸತಿ ಬೆಂಬಲ).`,
    actionLinkEn: { text: 'Browse Healthcare Jobs', url: '/jobs?category=Healthcare' },
    actionLinkKn: { text: 'ಆರೋಗ್ಯ ಕ್ಷೇತ್ರದ ಉದ್ಯೋಗಗಳು', url: '/jobs?category=Healthcare' },
    optionsEn: ['Salary benchmarks in Kolar', 'How to apply?'],
    optionsKn: ['ಕೋಲಾರ ಜಿಲ್ಲೆಯಲ್ಲಿ ಸರಾಸರಿ ವೇತನ', 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?'],
  },
  {
    keywords: ['salary', 'pay', 'inr', 'wage', 'benchmark', 'earn', 'ವೇತನ', 'ಸಂಬಳ', 'ಆದಾಯ'],
    answerEn: `💰 **Standard Salary Benchmarks in Kolar District (2026)**\n\n• **Entry-level & ITI Technicians**: ₹16,000 – ₹24,000 / month\n• **Registered Staff Nurses**: ₹22,000 – ₹38,000 / month\n• **Quality & Manufacturing Engineers**: ₹28,000 – ₹50,000 / month\n• **Software & Embedded Developers**: ₹35,000 – ₹70,000 / month\n• **Warehouse & Logistics Supervisors**: ₹22,000 – ₹35,000 / month\n\n*All listings on Jobs in Kolar disclose transparent monthly pay.*`,
    answerKn: `💰 **ಕೋಲಾರ ಜಿಲ್ಲೆಯ ಪ್ರಸ್ತುತ ವೇತನ ಶ್ರೇಣಿ (2026)**\n\n• **ಫ್ರೆಷರ್ ಮತ್ತು ITI ಟೆಕ್ನಿಷಿಯನ್**: ₹16,000 – ₹24,000 / ತಿಂಗಳು\n• **ನೋಂದಾಯಿತ ಸ್ಟಾಫ್ ನರ್ಸ್**: ₹22,000 – ₹38,000 / ತಿಂಗಳು\n• **ಗುಣಮಟ್ಟ ಮತ್ತು ಉತ್ಪಾದನಾ ಇಂಜಿನಿಯರ್**: ₹28,000 – ₹50,000 / ತಿಂಗಳು\n• **ಸಾಫ್ಟ್‌ವೇರ್ ಮತ್ತು ಎಂಬೆಡೆಡ್ ಡೆವಲಪರ್**: ₹35,000 – ₹70,000 / ತಿಂಗಳು\n• **ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಮೇಲ್ವಿಚಾರಕ**: ₹22,000 – ₹35,000 / ತಿಂಗಳು`,
    optionsEn: ['View All Open Jobs', 'Post a Job Opening'],
    optionsKn: ['ಎಲ್ಲಾ ಉದ್ಯೋಗಗಳನ್ನು ವೀಕ್ಷಿಸಿ', 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ'],
  },
  {
    keywords: ['post', 'employer', 'company', 'hire', 'vacancy', 'recruit', 'ಉದ್ಯೋಗ ಪ್ರಕಟ', 'ನೇಮಕಾತಿ', 'ಕಂಪನಿ'],
    answerEn: `🏢 **Posting a Job as an Employer**\n\n1. Go to **Post a Job** in the top navigation.\n2. Enter title, required experience, monthly salary range, and taluk (Kolar, Malur, Bangarapet, KGF, etc.).\n3. Our moderation team reviews the post within 2 hours to ensure trust.\n4. Once approved, local candidates can apply directly with phone numbers and resumes.`,
    answerKn: `🏢 **ಉದ್ಯೋಗದಾತರಾಗಿ ಖಾಲಿ ಹುದ್ದೆ ಪ್ರಕಟಿಸುವುದು ಹೇಗೆ**\n\n1. ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿ **Post a Job** ಕ್ಲಿಕ್ ಮಾಡಿ.\n2. ಹುದ್ದೆಯ ಹೆಸರು, ಅನುಭವ, ಮಾಸಿಕ ವೇತನ ಮತ್ತು ತಾಲೂಕು ನಮೂದಿಸಿ.\n3. ನಕಲಿ ಜಾಹೀರಾತು ತಡೆಯಲು ನಮ್ಮ ತಂಡವು 2 ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸುತ್ತದೆ.\n4. ನಂತರ ಸ್ಥಳೀಯ ಅರ್ಹ ಅಭ್ಯರ್ಥಿಗಳು ನೇರವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುತ್ತಾರೆ.`,
    actionLinkEn: { text: 'Post a Job Listing Now', url: '/employers/post' },
    actionLinkKn: { text: 'ಈಗಲೇ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ', url: '/employers/post' },
    optionsEn: ['How do candidates apply?', 'Browse open positions'],
    optionsKn: ['ಅಭ್ಯರ್ಥಿಗಳು ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುತ್ತಾರೆ?', 'ತೆರೆದಿರುವ ಉದ್ಯೋಗಗಳು'],
  },
  {
    keywords: ['apply', 'resume', 'cv', 'profile', 'ಅರ್ಜಿ', 'ರೆಸ್ಯೂಮೆ'],
    answerEn: `⚡ **1-Click Application Process**\n\n1. Find your preferred role on the **Browse Jobs** page.\n2. Tap the **Apply** button.\n3. Fill in your name, contact phone number, and optionally attach your resume (PDF/Word).\n4. The employer receives your application immediately and will contact you directly via phone or dashboard!`,
    answerKn: `⚡ **1-ಕ್ಲಿಕ್ ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ**\n\n1. **Browse Jobs** ಪುಟದಲ್ಲಿ ನಿಮಗೆ ಸರಿಹೊಂದುವ ಕೆಲಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n2. **Apply** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.\n3. ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ರೆಸ್ಯೂಮೆ ಲಗತ್ತಿಸಿ.\n4. ಉದ್ಯೋಗದಾತರಿಗೆ ನಿಮ್ಮ ವಿವರ ತಕ್ಷಣ ತಲುಪುತ್ತದೆ ಮತ್ತು ಅವರು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ!`,
    actionLinkEn: { text: 'Browse Jobs in Kolar', url: '/jobs' },
    actionLinkKn: { text: 'ಕೋಲಾರ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ', url: '/jobs' },
    optionsEn: ['Narasapura Industrial jobs', 'Vemagal tech jobs'],
    optionsKn: ['ನರಸಾಪುರ ಕೈಗಾರಿಕಾ ಉದ್ಯೋಗಗಳು', 'ವೇಮಗಲ್ ಟೆಕ್ ಉದ್ಯೋಗಗಳು'],
  },
]

function getAnswer(input: string, lang: Lang): ChatMessage {
  const query = input.toLowerCase()
  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => query.includes(kw.toLowerCase()))) {
      return {
        id: 'reply-' + Date.now(),
        sender: 'assistant',
        text: lang === 'kn' ? item.answerKn : item.answerEn,
        timestamp: 'Just now',
        actionLink: lang === 'kn' ? item.actionLinkKn : item.actionLinkEn,
        options: lang === 'kn' ? item.optionsKn : item.optionsEn,
      }
    }
  }

  // Fallback response
  if (lang === 'kn') {
    return {
      id: 'reply-' + Date.now(),
      sender: 'assistant',
      text: `ಕ್ಷಮಿಸಿ, ಈ ಬಗ್ಗೆ ನನಗೆ ಸ್ಪಷ್ಟ ಮಾಹಿತಿ ಇಲ್ಲ. ನೀವು ನರಸಾಪುರ ಉದ್ಯೋಗಗಳು, ವೇಮಗಲ್ ಟೆಕ್, ಆಸ್ಪತ್ರೆ ಹುದ್ದೆಗಳು ಅಥವಾ ವೇತನ ಶ್ರೇಣಿಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಬಹುದು.`,
      timestamp: 'Just now',
      options: [
        '🏭 ನರಸಾಪುರ ಕೈಗಾರಿಕಾ ಉದ್ಯೋಗಗಳು',
        '💻 ವೇಮಗಲ್ ಸಾಫ್ಟ್‌ವೇರ್ ಹುದ್ದೆಗಳು',
        '💰 ವೇತನ ಶ್ರೇಣಿಗಳು',
      ],
    }
  }

  return {
    id: 'reply-' + Date.now(),
    sender: 'assistant',
    text: `I’m here to help with all career opportunities in Kolar district! You can ask about **Narasapura automotive plants**, **Vemagal tech park**, **SNR Hospital vacancies**, or **how to post a job**.`,
    timestamp: 'Just now',
    options: [
      '🏭 Narasapura Industrial jobs',
      '💻 Vemagal tech openings',
      '💰 Salary benchmarks in Kolar',
    ],
  }
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('en')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_EN])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset welcome message on language change
    setMessages([lang === 'kn' ? WELCOME_KN : WELCOME_EN])
  }, [lang])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setHasUnread(false)
    }
  }, [messages, isOpen])

  function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: 'Just now',
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const reply = getAnswer(text, lang)
      setMessages((prev) => [...prev, reply])
      setIsTyping(false)
    }, 400)
  }

  function handleReset() {
    setMessages([lang === 'kn' ? WELCOME_KN : WELCOME_EN])
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 60 }}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Career Assistant"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '9999px',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 12px 30px rgba(30, 58, 138, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Bot size={20} style={{ color: '#fb7185' }} />
            {hasUnread && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 0 2px #ffffff',
                }}
              />
            )}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1.2 }}>
              Kolar AI Assistant <Sparkles size={13} style={{ color: '#fbbf24' }} />
            </div>
            <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
              Instant Career & Job Help
            </div>
          </div>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div
          style={{
            width: 'min(400px, 92vw)',
            height: 'min(580px, 82vh)',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 25px 60px -10px rgba(30, 41, 59, 0.28)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fb7185',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14.5px', display: 'block', lineHeight: 1.2 }}>
                  Kolar Career Assistant
                </strong>
                <span style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                  Online · Kolar Region Expert
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Toggle English / Kannada"
              >
                {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
              </button>

              <button
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: '0',
                  color: '#cbd5e1',
                  padding: '6px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
                title="Restart conversation"
              >
                <RefreshCw size={15} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: '0',
                  color: '#cbd5e1',
                  padding: '6px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#f8fafc',
            }}
          >
            {messages.map((m) => {
              const isBot = m.sender === 'assistant'
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '12px 14px',
                      borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      background: isBot ? '#ffffff' : 'linear-gradient(135deg, #e11d48, #be123c)',
                      color: isBot ? 'var(--text-main)' : '#ffffff',
                      fontSize: '13.5px',
                      lineHeight: 1.55,
                      boxShadow: '0 2px 6px rgba(30, 41, 59, 0.05)',
                      border: isBot ? '1px solid var(--border-light)' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.text}

                    {m.actionLink && (
                      <div style={{ marginTop: '10px' }}>
                        <Link
                          href={m.actionLink.url}
                          onClick={() => setIsOpen(false)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          {m.actionLink.text} <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Quick option pills */}
                  {isBot && m.options && m.options.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {m.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(opt)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '9999px',
                            padding: '5px 11px',
                            fontSize: '11.5px',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)'
                            e.currentTarget.style.color = 'var(--primary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', paddingLeft: '8px' }}>
                <Bot size={14} style={{ color: 'var(--primary)' }} />
                <span>Assistant is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '12px 14px',
              background: '#ffffff',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'kn' ? 'ಕೋಲಾರ ಉದ್ಯೋಗಗಳ ಬಗ್ಗೆ ಕೇಳಿ...' : 'Ask about jobs, salaries, plants...'}
              style={{
                flex: 1,
                border: '1px solid var(--border-light)',
                borderRadius: '9999px',
                padding: '9px 16px',
                fontSize: '13px',
                outline: 'none',
                background: 'var(--bg-soft)',
                color: 'var(--text-main)',
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e11d48, #be123c)',
                color: '#ffffff',
                border: '0',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(225, 29, 72, 0.25)',
              }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
