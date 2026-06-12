// src/data/providers.ts
//
// Typed, single source of truth for the local support-provider and
// hotline directory. The same list powers SupportHub (hotlines) and
// GISFeature (the full map view).
//
// IMPORTANT: every entry below is unverified. lastVerifiedAt is null and
// sourceUrl is "internal-tbd" until a maintainer confirms the entry
// against a primary source (the provider's official page, a government
// directory, or a phone call). Do not promote an entry to a "verified"
// claim in user-facing copy until that has happened.
//
// The local directory currently focuses on Panay (Iloilo, Capiz, Antique,
// Guimaras) and Negros Occidental. The schema is open enough to add more
// regions and providers without code changes; the loader function
// (loadProviders) is the single point that would later swap a Supabase
// table for this hard-coded list.

export type ProviderCategory = "psychiatrist" | "community" | "support" | "hotline";

export interface ProviderLocation {
  label: string;
  lat: number;
  lng: number;
}

export interface ServiceHours {
  /** Free-form description, e.g. "24/7", "Mon-Fri 8am-5pm", "TBC" */
  display: string;
  /** True only when verified. Unverified entries should use "TBC" display. */
  is24x7: boolean;
  isConfirmed: boolean;
}

export interface VerificationMeta {
  /** URL the entry was last checked against. "internal-tbd" means
   *  maintainers still need to source it. */
  sourceUrl: string;
  /** ISO-8601 timestamp of the last verification, or null if not yet
   *  verified. */
  lastVerifiedAt: string | null;
  /** Person or org who verified, or null. */
  verifiedBy: string | null;
  /** When the entry was added to this directory. */
  addedAt: string;
}

export interface ProviderRecord {
  id: string;
  name: string;
  type: string;
  category: ProviderCategory;
  clinic: string;
  city: string;
  region: string;
  tags: string[];
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  fb?: string | null;
  hours?: ServiceHours;
  coverage?: string;
  isFree?: boolean | null;
  isConfidential?: boolean | null;
  lat?: number;
  lng?: number;
  locations?: ProviderLocation[];
  verification: VerificationMeta;
}

export type HotlineRecord = ProviderRecord & {
  category: "hotline";
  phone: string;
};

const UNVERIFIED: VerificationMeta = {
  sourceUrl: "internal-tbd",
  lastVerifiedAt: null,
  verifiedBy: null,
  addedAt: "2025-01-01T00:00:00Z",
};

const REGION_PANAY = "Panay";
const REGION_NEGROS = "Negros Occidental";
const REGION_NATIONAL = "National";

const hours = (display: string, is24x7: boolean): ServiceHours => ({
  display,
  is24x7,
  isConfirmed: false,
});

export const PROVIDERS: ProviderRecord[] = [
  {
    id: "psy_0001",
    name: "Dr. Japhet Fernandez De Leon",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Iloilo Doctors' Hospital",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Adult Care", "Assessment"],
    phone: "+63-33-337-7702",
    lat: 10.697364579578656,
    lng: 122.5542997364835,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0002",
    name: "Dr. Henrietta Española",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "St. Paul's Hospital Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Therapy"],
    phone: null,
    lat: 10.702109073072572,
    lng: 122.5668240306581,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0003",
    name: "Dr. Donaldo Nicanor Tugbang",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Iloilo Medical Center",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Diagnostics"],
    phone: "+63-33-337-1283",
    lat: 10.702198349378662,
    lng: 122.56798242667763,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0004",
    name: "Dr. Evony Allisa-Deveza",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "WVSU Medical Center",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "WVSU"],
    phone: "+63-33-320-2431",
    phone2: "+63-33-332-0037",
    fb: "https://web.facebook.com/ZSODIAGNOSTIC",
    lat: 10.716144858647683,
    lng: 122.56127087344781,
    locations: [
      {
        label: "WVSU Medical Center, E. Lopez St.",
        lat: 10.716144858647683,
        lng: 122.56127087344781,
      },
      {
        label: "ZSO Diagnostic, E. Lopez San Vicente, Jaro",
        lat: 10.720540445791599,
        lng: 122.55944990949331,
      },
    ],
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0005",
    name: "Dr. Elysse Jane Magalona",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Western Visayas Medical Center",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Government"],
    phone: "+63-33-330-7700",
    lat: 10.718980363764818,
    lng: 122.5415419518234,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0006",
    name: "Dr. Ryzameil Andrea Uy-Pesqueria",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "WVSU / Situbal / IMC",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Multi-clinic"],
    phone: "+63-905-021-8240",
    lat: 10.716144858647683,
    lng: 122.56127087344781,
    locations: [
      {
        label: "WVSU Medical Center, E. Lopez St., Iloilo",
        lat: 10.716144858647683,
        lng: 122.56127087344781,
      },
      {
        label: "Situbal Medical Clinic, PC Barracks Rd., Hamtic, Antique",
        lat: 10.701498645547607,
        lng: 121.98175786716308,
      },
      {
        label: "Iloilo Medical Center, Bonifacio Dr., Danao",
        lat: 10.702208891593429,
        lng: 122.56787513832813,
      },
    ],
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0007",
    name: "Dr. Jeffrey Gellada",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Healthlink Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Clinic"],
    phone: "+63-935-090-6655",
    lat: 10.698928509093047,
    lng: 122.56464941133775,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0008",
    name: "Dr. Arlene Resano",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Balajadia Clinic / San Antonio Clinic",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Multi-clinic"],
    phone: "+63-932-870-2765",
    phone2: "+63-939-100-3040",
    lat: 10.718274039293961,
    lng: 122.5372678959981,
    locations: [
      {
        label: "Balajadia Medical Clinic, Young Arcade, Q. Abeto St., Manduriao",
        lat: 10.718274039293961,
        lng: 122.5372678959981,
      },
      {
        label: "San Antonio Medical & Diagnostic Clinic, Banguit, Cabatuan, Iloilo",
        lat: 10.870333397848897,
        lng: 122.4932412978441,
      },
    ],
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0009",
    name: "Dr. Eunice Sermonia",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Healthlink Iloilo Inc.",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Clinic"],
    phone: "+63-33-336-5434",
    lat: 10.698970678404713,
    lng: 122.56471378434745,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0010",
    name: "Dr. Karey Lois Charisse Valencia",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Western Visayas Medical Center",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "WVMC"],
    phone: "+63-945-103-1819",
    phone2: "+63-931-025-1276",
    lat: 10.718885489071514,
    lng: 122.54161705366809,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0011",
    name: "Dr. Diosdado Amargo Jr.",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "St. Paul's Hospital Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry"],
    lat: 10.702045819757567,
    lng: 122.56684548832798,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0012",
    name: "Dr. Leah Florence Sicad",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Capiz Doctors Hospital",
    city: "Roxas City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "Capiz"],
    phone: "+63-36-621-0429",
    lat: 11.565678631578253,
    lng: 122.75275245183066,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0013",
    name: "Dr. April Rose Hechanova-Espinosa",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Trivi Building Clinic",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Psychiatry", "Bacolod"],
    lat: 10.667257592488145,
    lng: 122.94279422114334,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0014",
    name: "Dr. Julius Paul Juen",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Metro Bacolod Hospital",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Psychiatry", "Bacolod"],
    phone: "+63-34-468-2100",
    phone2: "+63-34-488-7288",
    fb: "https://www.facebook.com/MBHMCofficial/",
    lat: 10.69668593766049,
    lng: 122.96130192667749,
    locations: [
      {
        label: "Maxicare Primary Care Center, Lacson St., Mandalagan, Bacolod",
        lat: 10.69668593766049,
        lng: 122.96130192667749,
      },
      {
        label: "The Doctors Hospital, Bacolod City",
        lat: 10.678318407382848,
        lng: 122.96041512483279,
      },
      {
        label: "Metro Bacolod Hospital & Medical Center, Burgos Ext., Estefania",
        lat: 10.661426569441243,
        lng: 122.98495610764836,
      },
    ],
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0015",
    name: "Dr. Harlea Bancoleta",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Corazon Locsin Montelibano Hospital",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Psychiatry", "Bacolod"],
    lat: 10.6723332652727,
    lng: 122.95103691133772,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0016",
    name: "Dr. Cherryl Velasco-Francia",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "VLI The Medical Plaza",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Psychiatry", "Bacolod"],
    phone: "+63-34-434-9001",
    lat: 10.676655789005393,
    lng: 122.96052114446319,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0017",
    name: "Dr. Eufemio Sobrevega",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Iloilo Doctors' Hospital",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry"],
    phone: "+63-33-337-5320",
    lat: 10.697348776549134,
    lng: 122.55441775767288,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0018",
    name: "Dr. Euriz Calmerin",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Metro Bacolod Hospital",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Psychiatry", "Bacolod"],
    phone: "+63-34-488-7288",
    lat: 10.661411906532729,
    lng: 122.9849669338003,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0019",
    name: "Dr. Anna Natalia Nina Tayo",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "Healthlink Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry"],
    phone: "+63-912-529-1311",
    lat: 10.698921194746818,
    lng: 122.56254851818348,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "psy_0020",
    name: "Dr. Victor Amantillo",
    type: "Psychiatrist",
    category: "psychiatrist",
    clinic: "St. Paul's Hospital Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychiatry", "PPA"],
    phone: "+63-33-337-2741",
    lat: 10.702122599988705,
    lng: 122.56684148658569,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0001",
    name: "PMHA Negros Occidental Chapter",
    type: "Community Program",
    category: "community",
    clinic: "Cottage Road, Bacolod City",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Mental Health", "Education", "Outreach"],
    email: "pmha_bacolod@yahoo.com.ph",
    lat: 10.674274233924532,
    lng: 122.95061462672369,
    isFree: true,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0002",
    name: "Sunshine Care Foundation",
    type: "NGO",
    category: "community",
    clinic: "Metro Iloilo & Roxas City",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Movement Disorders", "Advocacy"],
    phone: "+63-917-841-4234",
    lat: 10.762882652821062,
    lng: 122.58094578989117,
    locations: [
      {
        label: "Metro Iloilo Medical Center, Metropolis Ave., Iloilo City",
        lat: 10.762882652821062,
        lng: 122.58094578989117,
      },
      {
        label: "The Health Centrum, Teodorica Ave., Banica, Roxas City",
        lat: 11.581415121674768,
        lng: 122.76791217301859,
      },
    ],
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0003",
    name: "PRIME Helpline Iloilo",
    type: "Community Program",
    category: "community",
    clinic: "Casa Real de Iloilo, Gen. Luna St.",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Crisis Support", "24/7", "Suicide Prevention"],
    phone: "+63-968-855-0997",
    phone2: "+63-966-241-8133",
    fb: "https://www.facebook.com/primehelpline",
    lat: 10.702072708877559,
    lng: 122.5691675865093,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0004",
    name: "WVMC Dept. of Psychiatry",
    type: "Hospital",
    category: "community",
    clinic: "Q. Abeto St., Mandurriao",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Acute Care", "Outpatient", "Government"],
    phone: "+63-33-330-7700",
    phone2: "+63-2-894-2-6843",
    lat: 10.71823721240049,
    lng: 122.54264235767286,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0005",
    name: "Pototan Mental Health Unit",
    type: "Hospital",
    category: "community",
    clinic: "Iloilo-Capiz Road, Pototan",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Inpatient", "Outpatient"],
    phone: "+63-981-814-0312",
    lat: 10.928133852744487,
    lng: 122.63015961720079,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0006",
    name: "Bacolod Mental Health Center",
    type: "Hospital",
    category: "community",
    clinic: "Burgos-Lacson St., Bacolod City",
    city: "Bacolod City",
    region: REGION_NEGROS,
    tags: ["Neuropsych", "Family Therapy", "Emergency"],
    phone: "+63-34-446-0474",
    lat: 10.619663135077806,
    lng: 122.9999250822294,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0007",
    name: "USA Guidance & Counseling",
    type: "Campus Support",
    category: "community",
    clinic: "Univ. of San Agustin, Gen. Luna St.",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Student Support", "Peer", "Career"],
    phone: "+63-951-189-6559",
    lat: 10.699697832647951,
    lng: 122.5628625558178,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0008",
    name: 'WVSU "Taltal" Program',
    type: "Campus Support",
    category: "community",
    clinic: "West Visayas State University",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Student", "Counseling", "Well-being"],
    phone: null,
    lat: 10.71388230715029,
    lng: 122.56249237487366,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0009",
    name: "Teen Center 2.0 Iloilo",
    type: "Community Program",
    category: "community",
    clinic: "Iloilo Provincial Capitol (PSWDO)",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Youth", "Adolescent", "Peer Counseling"],
    lat: 10.702489752153184,
    lng: 122.56924331195957,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0010",
    name: "DOH DATRC Pototan",
    type: "Community Program",
    category: "community",
    clinic: "Brgy. Rumbang, Pototan",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Drug Rehab", "Residential", "Therapeutic"],
    phone: "+63-33-529-8955",
    lat: 10.929183951980265,
    lng: 122.62984182698138,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0011",
    name: "PGCA Western Visayas",
    type: "Community Program",
    category: "community",
    clinic: "University of San Agustin",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Professional", "Advocacy", "Referral"],
    email: "pgca.iloilo.chapter@gmail.com",
    lat: 10.700005087363353,
    lng: 122.56315298482635,
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0012",
    name: "Project Paglaum (CHO)",
    type: "Community Program",
    category: "community",
    clinic: "Iloilo City Health Office, Mabini St.",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["MHPSS", "Trauma", "LGU"],
    lat: 10.694786608311848,
    lng: 122.5729591413271,
    isFree: true,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0013",
    name: "Family Life Center (CPU)",
    type: "Campus Support",
    category: "community",
    clinic: "Central Philippine University, Jaro",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Family Counseling", "Parenting", "Spiritual"],
    lat: 10.731568929722172,
    lng: 122.5469395865857,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "grp_0014",
    name: "Antique MHPSS Network",
    type: "Community Program",
    category: "community",
    clinic: "Municipal Health Office, San Jose",
    city: "Antique",
    region: REGION_PANAY,
    tags: ["Crisis Response", "PFA", "Awareness"],
    email: "mhosanjose06@gmail.com",
    lat: 10.755760096736058,
    lng: 121.94189515392358,
    isFree: true,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0001",
    name: "Agubayani",
    type: "Trusted Support",
    category: "support",
    clinic: "Iloilo City",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Mental Health", "Youth", "Community"],
    phone: "+63-906-246-4502",
    fb: "https://www.facebook.com/agubayani",
    lat: 10.7302,
    lng: 122.5591,
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0002",
    name: "CAMELEON Association Philippines",
    type: "NGO",
    category: "support",
    clinic: "Passi City",
    city: "Passi City",
    region: REGION_PANAY,
    tags: ["Trauma Care", "Art Therapy", "Women"],
    phone: "+63-33-329-2309",
    lat: 11.108947673597761,
    lng: 122.64284466199415,
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0003",
    name: "St. Brigid Wellness Center",
    type: "Clinic",
    category: "support",
    clinic: "Brgy. San Rafael, Mandurriao",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Wellness", "Collaborative Care"],
    phone: "+63-942-096-9168",
    fb: "https://www.facebook.com/p/St-Brigid-Wellness-Center-Iloilo-100088977521968/",
    lat: 10.683236439214532,
    lng: 122.53099501140379,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0004",
    name: "DSWD Field Office VI",
    type: "Trusted Support",
    category: "support",
    clinic: "M.H. del Pilar St., Molo, Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Psychosocial", "Emergency", "Referral"],
    phone: "+63-33-330-7860",
    lat: 10.698425704874138,
    lng: 122.54757374532636,
    isFree: true,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0005",
    name: "FPOP Iloilo Chapter",
    type: "NGO",
    category: "support",
    clinic: "Rizal St., Iloilo City",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Family Planning", "Referral"],
    phone: "+63-33-509-8846",
    lat: 10.69203779499814,
    lng: 122.56854072698141,
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0006",
    name: "Healthway QualiMed Women & Children",
    type: "Clinic",
    category: "support",
    clinic: "Atria Park District, Mandurriao",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Women", "Children", "Psychiatric"],
    lat: 10.706738231006216,
    lng: 122.54558354616391,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0007",
    name: "PHINMA University of Iloilo",
    type: "Campus Support",
    category: "support",
    clinic: "Student Services",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Student", "Anxiety", "Free Sessions"],
    fb: "https://web.facebook.com/uicsdl/",
    lat: 10.701270257516247,
    lng: 122.56250085026352,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0008",
    name: "WVSU Center for Mindfulness",
    type: "Campus Support",
    category: "support",
    clinic: "West Visayas State University",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Mindfulness", "Outreach", "Community"],
    phone: "+63-33-320-0870",
    lat: 10.715184351930294,
    lng: 122.56198585383945,
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0009",
    name: "Hua Siong Guidance Program",
    type: "Campus Support",
    category: "support",
    clinic: "Hua Siong College of Iloilo",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Student", "Counseling", "Testing"],
    phone: "+63-33-337-3679",
    phone2: "+63-33-335-0145",
    lat: 10.697113310167406,
    lng: 122.56901465366786,
    isFree: null,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0010",
    name: "Peer Helpers Network (LGU)",
    type: "Community Program",
    category: "support",
    clinic: "Iloilo City LGU",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Peer Support", "Youth", "Community"],
    phone: "+63-968-566-3131",
    lat: 10.694287756747556,
    lng: 122.57307009631039,
    isFree: true,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "sup_0011",
    name: "USA Guidance Center",
    type: "Campus Support",
    category: "support",
    clinic: "University of San Agustin",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Walk-in", "Group Counseling", "Academic"],
    phone: "+63-951-189-6559",
    lat: 10.701270257516247,
    lng: 122.56250085026352,
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
];

export const HOTLINES: HotlineRecord[] = [
  {
    id: "hot_0001",
    name: "PRIME Mental Health Helpline",
    type: "Hotline",
    category: "hotline",
    clinic: "",
    city: "Iloilo Province",
    region: REGION_PANAY,
    tags: ["Crisis Support", "24/7"],
    phone: "+63-968-855-0997",
    fb: "https://www.facebook.com/primehelpline",
    hours: hours("24/7", true),
    coverage: "Iloilo Province",
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "hot_0002",
    name: "AH Connect – DOH Western Visayas",
    type: "Hotline",
    category: "hotline",
    clinic: "",
    city: "Region 6",
    region: REGION_PANAY,
    tags: ["Crisis Support", "Referral"],
    phone: "+63-917-775-9256",
    hours: hours("TBC", false),
    coverage: "Region 6",
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "hot_0003",
    name: "WVMC Mental Health Hotline",
    type: "Hotline",
    category: "hotline",
    clinic: "",
    city: "Iloilo City",
    region: REGION_PANAY,
    tags: ["Crisis Support"],
    phone: "+63-931-025-1276",
    hours: hours("TBC", false),
    coverage: "Iloilo City",
    isFree: null,
    isConfidential: null,
    verification: { ...UNVERIFIED },
  },
  {
    id: "hot_0004",
    name: "NCMH Crisis Line",
    type: "Hotline",
    category: "hotline",
    clinic: "",
    city: "National",
    region: REGION_NATIONAL,
    tags: ["Crisis Support", "24/7", "Suicide Prevention"],
    phone: "+63-917-899-8727",
    hours: hours("24/7", true),
    coverage: "National",
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
  {
    id: "hot_0005",
    name: "Hopeline Philippines",
    type: "Hotline",
    category: "hotline",
    clinic: "",
    city: "National",
    region: REGION_NATIONAL,
    tags: ["Crisis Support", "24/7", "Suicide Prevention"],
    phone: "+63-917-558-4673",
    hours: hours("24/7", true),
    coverage: "National",
    isFree: true,
    isConfidential: true,
    verification: { ...UNVERIFIED },
  },
];

export interface DirectorySummary {
  totalProviders: number;
  totalHotlines: number;
  regions: string[];
  byCategory: Record<ProviderCategory, number>;
  unverifiedCount: number;
}

export function summarizeDirectory(): DirectorySummary {
  const byCategory: Record<ProviderCategory, number> = {
    psychiatrist: 0,
    community: 0,
    support: 0,
    hotline: 0,
  };
  let unverifiedCount = 0;
  const regions = new Set<string>();

  for (const p of PROVIDERS) {
    byCategory[p.category] += 1;
    regions.add(p.region);
    if (p.verification.lastVerifiedAt == null) unverifiedCount += 1;
  }
  for (const h of HOTLINES) {
    byCategory[h.category] += 1;
    regions.add(h.region);
    if (h.verification.lastVerifiedAt == null) unverifiedCount += 1;
  }

  return {
    totalProviders: PROVIDERS.length,
    totalHotlines: HOTLINES.length,
    regions: Array.from(regions).sort(),
    byCategory,
    unverifiedCount,
  };
}

/**
 * Returns a shallow copy of the directory. Replace this with a Supabase
 * query when the directory moves server-side. The current shape is
 * deliberately compatible with a future SELECT * FROM providers
 * result, so call sites do not have to change.
 */
export function loadProviders(): ProviderRecord[] {
  return PROVIDERS.map((p) => ({ ...p }));
}

export function loadHotlines(): HotlineRecord[] {
  return HOTLINES.map((h) => ({ ...h, category: "hotline" as const }));
}

/**
 * Returns true only when the entry has been confirmed against a
 * source after 2024-01-01. Until maintainers verify the directory,
 * callers should treat the verification as "unverified" and surface
 * the `sourceUrl` and `lastVerifiedAt` fields rather than a verified
 * badge.
 */
export function isVerifiedProvider(p: ProviderRecord, now: Date = new Date()): boolean {
  if (!p.verification.lastVerifiedAt) return false;
  if (p.verification.sourceUrl === "internal-tbd") return false;
  const verifiedAt = new Date(p.verification.lastVerifiedAt);
  if (Number.isNaN(verifiedAt.getTime())) return false;
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return verifiedAt >= sixMonthsAgo;
}
