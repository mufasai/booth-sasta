export interface Booth {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  category: "Bank" | "Regulator" | "Fintech & Pasar Modal" | "Asosiasi";
  color: string;
  accent: string;
}

export const BOOTHS: Booth[] = [
  {
    id: "mandiri",
    name: "Bank Mandiri",
    shortName: "Mandiri",
    initials: "BM",
    category: "Bank",
    color: "#003b70",
    accent: "#f5a623",
  },
  {
    id: "afpi",
    name: "AFPI",
    shortName: "AFPI",
    initials: "AF",
    category: "Fintech & Pasar Modal",
    color: "#c8282f",
    accent: "#ff5252",
  },
  {
    id: "bca",
    name: "Bank Central Asia",
    shortName: "BCA",
    initials: "BCA",
    category: "Bank",
    color: "#005baa",
    accent: "#38bdf8",
  },
  {
    id: "mega",
    name: "Bank Mega",
    shortName: "Mega",
    initials: "BM",
    category: "Bank",
    color: "#f37021",
    accent: "#ffd166",
  },
  {
    id: "bank_jakarta",
    name: "Bank Jakarta",
    shortName: "Bank DKI",
    initials: "BJ",
    category: "Bank",
    color: "#d9251d",
    accent: "#ff6b6b",
  },
  {
    id: "ojk",
    name: "OJK Jabodebek",
    shortName: "OJK",
    initials: "OJK",
    category: "Regulator",
    color: "#990000",
    accent: "#d4af37",
  },
  {
    id: "bi",
    name: "Bank Indonesia",
    shortName: "BI",
    initials: "BI",
    category: "Regulator",
    color: "#1f4e8c",
    accent: "#60a5fa",
  },
  {
    id: "bri",
    name: "Bank Rakyat Indonesia",
    shortName: "BRI",
    initials: "BRI",
    category: "Bank",
    color: "#00529b",
    accent: "#ff8c00",
  },
  {
    id: "bni",
    name: "Bank Negara Indonesia",
    shortName: "BNI",
    initials: "BNI",
    category: "Bank",
    color: "#005e54",
    accent: "#f15a24",
  },
  {
    id: "bsi",
    name: "Bank Syariah Indonesia",
    shortName: "BSI",
    initials: "BSI",
    category: "Bank",
    color: "#00a39d",
    accent: "#e5a823",
  },
  {
    id: "netzme",
    name: "Netzme",
    shortName: "Netzme",
    initials: "NM",
    category: "Fintech & Pasar Modal",
    color: "#7b4fa0",
    accent: "#c084fc",
  },
  {
    id: "pegadaian",
    name: "Pegadaian",
    shortName: "Pegadaian",
    initials: "PG",
    category: "Bank",
    color: "#00833e",
    accent: "#a3e635",
  },
  {
    id: "btn",
    name: "Bank Tabungan Negara",
    shortName: "BTN",
    initials: "BTN",
    category: "Bank",
    color: "#002d62",
    accent: "#facc15",
  },
  {
    id: "cimb",
    name: "CIMB Niaga",
    shortName: "CIMB",
    initials: "CN",
    category: "Bank",
    color: "#7e1117",
    accent: "#ef4444",
  },
  {
    id: "bei",
    name: "Bursa Efek Indonesia",
    shortName: "BEI / IDX",
    initials: "BEI",
    category: "Fintech & Pasar Modal",
    color: "#18263d",
    accent: "#22c55e",
  },
  {
    id: "mnc_sekuritas",
    name: "MNC Sekuritas",
    shortName: "MNC Sek.",
    initials: "MS",
    category: "Fintech & Pasar Modal",
    color: "#0f2347",
    accent: "#fbbf24",
  },
  {
    id: "panin",
    name: "Panin Bank",
    shortName: "Panin",
    initials: "PB",
    category: "Bank",
    color: "#0d6938",
    accent: "#4ade80",
  },
  {
    id: "permata",
    name: "Permata Bank",
    shortName: "Permata",
    initials: "PM",
    category: "Bank",
    color: "#12733c",
    accent: "#86efac",
  },
  {
    id: "bsn",
    name: "Bank Syariah Nasional",
    shortName: "BSN",
    initials: "BSN",
    category: "Bank",
    color: "#1e5b8e",
    accent: "#38bdf8",
  },
  {
    id: "sukma",
    name: "Bank Sukma Hitamajaya",
    shortName: "Sukma",
    initials: "BSH",
    category: "Bank",
    color: "#c8282f",
    accent: "#1f4e8c",
  },
  {
    id: "aaui",
    name: "AAUI",
    shortName: "AAUI",
    initials: "AA",
    category: "Asosiasi",
    color: "#0f8b9d",
    accent: "#2dd4bf",
  },
];

export type VotingCategory = "edu" | "inter";

export interface CategoryInfo {
  id: VotingCategory;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  iconName: string;
  themeColor: string;
}

export const CATEGORIES: Record<VotingCategory, CategoryInfo> = {
  edu: {
    id: "edu",
    title: "Booth Teredukatif",
    badge: "EDUKATIF",
    subtitle: "Paling Informatif & Bikin Paham",
    description: "Pilih booth yang materinya paling jelas, edukatif, dan menambah wawasan literasi finansial Anda.",
    iconName: "GraduationCap",
    themeColor: "#1f4e8c",
  },
  inter: {
    id: "inter",
    title: "Booth Terinteraktif",
    badge: "INTERAKTIF",
    subtitle: "Paling Seru, Asik & Engaging",
    description: "Pilih booth dengan games, tim paling ramah, aktivitas terseru, dan pengalaman paling berkesan.",
    iconName: "Sparkles",
    themeColor: "#c8282f",
  },
};
