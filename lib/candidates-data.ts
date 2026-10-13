export interface Candidate {
  id: string
  fullName: string
  roleTitle: string
  category: 'manufacturing' | 'technology' | 'healthcare' | 'logistics' | 'education' | 'finance'
  categoryLabel: string
  taluk: string
  locality: string
  experienceYears: number
  education: string
  expectedSalary: string
  skills: string[]
  bio: string
  verified: boolean
  availableImmediately: boolean
  initials: string
  badgeColor: string
}

export const CANDIDATE_TALENT_POOL: Candidate[] = [
  {
    id: 'cand-1',
    fullName: 'Ramesh Gowda',
    roleTitle: 'Senior CNC / VMC Machinist & Quality Inspector',
    category: 'manufacturing',
    categoryLabel: 'Manufacturing & Auto',
    taluk: 'Kolar',
    locality: 'Narasapura Industrial Area',
    experienceYears: 6,
    education: 'Diploma in Mechanical Engineering (DME), ITI Machinist',
    expectedSalary: '₹28,000 – ₹35,000 / month',
    skills: ['CNC Milling', 'VMC Programming', 'Fanuc Controls', 'Micrometer & Vernier Calipers', '5S & Kaizen', 'Tolerance Inspection'],
    bio: '6 years of precision manufacturing experience at automotive tier-1 tier-2 suppliers in Narasapura and Hoskote corridor. Specialized in precision machining for automotive transmission components.',
    verified: true,
    availableImmediately: true,
    initials: 'RG',
    badgeColor: '#e11d48'
  },
  {
    id: 'cand-2',
    fullName: 'Dr. Divya Muniraju',
    roleTitle: 'Registered Staff Nurse (ICU & Critical Care)',
    category: 'healthcare',
    categoryLabel: 'Healthcare & Nursing',
    taluk: 'Kolar',
    locality: 'Gulpet, Kolar Town',
    experienceYears: 4,
    education: 'B.Sc Nursing (Karnataka Nursing Council Registered)',
    expectedSalary: '₹25,000 – ₹32,000 / month',
    skills: ['ICU Patient Care', 'Ventilator Monitoring', 'Emergency Triage', 'Medication Administration', 'NABH Standards', 'Post-Op Recovery'],
    bio: 'Dedicated nursing professional with 4 years clinical experience at multi-speciality hospitals. Seeking opportunities in Kolar Town or nearby medical centers with standard shifts.',
    verified: true,
    availableImmediately: true,
    initials: 'DM',
    badgeColor: '#059669'
  },
  {
    id: 'cand-3',
    fullName: 'Chetan Kumar N',
    roleTitle: 'Embedded Firmware & IoT Systems Engineer',
    category: 'technology',
    categoryLabel: 'Technology & IT',
    taluk: 'Kolar',
    locality: 'Vemagal Tech Zone',
    experienceYears: 3,
    education: 'B.E. in Electronics & Communication Engineering',
    expectedSalary: '₹40,000 – ₹55,000 / month',
    skills: ['Embedded C', 'STM32 Microcontrollers', 'ESP32 / FreeRTOS', 'I2C / SPI / CAN Bus', 'IoT Telemetry', 'PCB Debugging'],
    bio: 'Passionate hardware-firmware developer living in Kolar district. Experienced in developing wireless telemetry nodes and electronic motor controllers for smart industrial setups.',
    verified: true,
    availableImmediately: false,
    initials: 'CK',
    badgeColor: '#2563eb'
  },
  {
    id: 'cand-4',
    fullName: 'Syed Tanveer',
    roleTitle: 'Warehouse & Dispatch Supervisor',
    category: 'logistics',
    categoryLabel: 'Logistics & Supply Chain',
    taluk: 'Malur',
    locality: 'Malur Industrial Area Phase 2',
    experienceYears: 5,
    education: 'B.Com (Logistics & Supply Chain Diploma)',
    expectedSalary: '₹24,000 – ₹30,000 / month',
    skills: ['Warehouse Operations', 'WMS Software', 'Inventory Auditing', 'Dispatch Coordination', 'Forklift Safety', 'Vendor Compliance'],
    bio: 'Experienced in high-throughput 3PL warehousing and distribution hubs in Malur. Managed inbound and outbound shipments with 99.8% on-time accuracy.',
    verified: true,
    availableImmediately: true,
    initials: 'ST',
    badgeColor: '#7c3aed'
  },
  {
    id: 'cand-5',
    fullName: 'Prathap Reddy',
    roleTitle: 'Heavy Machinery & Mining Equipment Technician',
    category: 'manufacturing',
    categoryLabel: 'Manufacturing & Auto',
    taluk: 'KGF (Robertsonpet)',
    locality: 'Andersonpet, KGF',
    experienceYears: 7,
    education: 'ITI Heavy Vehicle & Hydraulics, BEML Training',
    expectedSalary: '₹30,000 – ₹42,000 / month',
    skills: ['Hydraulic Diagnostics', 'Earthmoving Machinery', 'Diesel Engine Overhaul', 'Preventive Maintenance', 'Pneumatic Systems'],
    bio: 'Trained near BEML KGF complex. Specialized in heavy hydraulic excavators, dump trucks, and manufacturing equipment maintenance.',
    verified: true,
    availableImmediately: true,
    initials: 'PR',
    badgeColor: '#e11d48'
  },
  {
    id: 'cand-6',
    fullName: 'Pooja Venkatesh',
    roleTitle: 'Senior Accountant & GST / Tally Prime Specialist',
    category: 'finance',
    categoryLabel: 'Finance & Accounts',
    taluk: 'Bangarapet',
    locality: 'Railway Station Road, Bangarapet',
    experienceYears: 4,
    education: 'M.Com in Advanced Accounting',
    expectedSalary: '₹22,000 – ₹28,000 / month',
    skills: ['Tally Prime', 'GST Returns (GSTR-1, 3B)', 'TDS / TCS Filing', 'Bank Reconciliation', 'Payroll Processing', 'Audit Preparation'],
    bio: 'Handled corporate accounting, monthly GST reconciliation, and employee payroll for manufacturing ancillaries and wholesale distributors across Kolar and Bangarapet.',
    verified: true,
    availableImmediately: false,
    initials: 'PV',
    badgeColor: '#d97706'
  },
  {
    id: 'cand-7',
    fullName: 'Kiran Babu K',
    roleTitle: 'Food Processing & Quality Lab Technician',
    category: 'manufacturing',
    categoryLabel: 'Food Processing & Agri',
    taluk: 'Srinivaspur',
    locality: 'APMC Market Area, Srinivaspur',
    experienceYears: 3,
    education: 'B.Sc in Food Technology & Microbiology',
    expectedSalary: '₹20,000 – ₹26,000 / month',
    skills: ['FSSAI Standards', 'Brix Testing', 'Cold Chain Monitoring', 'Packaging Quality', 'Microbiological Testing', 'HACCP Protocols'],
    bio: 'Specialist in mango processing, fruit pulp preservation, and cold-storage QA for the premier agricultural packaging centers in Srinivaspur taluk.',
    verified: true,
    availableImmediately: true,
    initials: 'KB',
    badgeColor: '#059669'
  },
  {
    id: 'cand-8',
    fullName: 'Anjali Sharma',
    roleTitle: 'Full-Stack Web & Mobile App Developer',
    category: 'technology',
    categoryLabel: 'Technology & IT',
    taluk: 'Mulbagal',
    locality: 'Someshwara Nagar, Mulbagal',
    experienceYears: 2,
    education: 'B.E. in Computer Science',
    expectedSalary: '₹35,000 – ₹48,000 / month',
    skills: ['React.js / Next.js', 'Node.js', 'PostgreSQL / Supabase', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
    bio: 'Software engineer keen on supporting tech modernization for local startups and enterprises in Kolar district. Remote or hybrid ready.',
    verified: true,
    availableImmediately: true,
    initials: 'AS',
    badgeColor: '#2563eb'
  }
]
