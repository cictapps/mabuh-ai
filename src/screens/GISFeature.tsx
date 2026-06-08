import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User as UserIcon,
  Users,
  Hospital,
  GraduationCap,
  HeartHandshake,
  Phone,
  PhoneCall,
  Map as MapIcon,
  Bookmark,
  BadgeCheck,
  MapPin,
  Siren,
  Locate,
  Satellite,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  Navigation2,
  Ruler,
  Mail,
  ClipboardCopy,
  Globe,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProviderLocation {
  label: string;  // clinic name
  lat: number;
  lng: number;
}

interface Provider {
  id: string; name: string; type: string; clinic: string; city: string;
  tags: string[]; phone?: string | null; email?: string | null;
  fb?: string | null; phone2?: string | null; verified: boolean;
  lat?: number; lng?: number; hours?: string; coverage?: string;
  locations?: ProviderLocation[];  // multiple clinic locations
}
type TabType = "all" | "psychologist" | "community" | "support" | "hotline";
type MapLayer = "street" | "satellite";
type SortType = "default" | "distance";
interface UserLocation { lat: number; lng: number; }

// ── Icon map — lucide-react components, sized inline at the call site ─────────
const G = {
  search:     Search,
  person:     UserIcon,
  group:      Users,
  hospital:   Hospital,
  campus:     GraduationCap,
  support:    HeartHandshake,
  hotline:    PhoneCall,
  phone:      Phone,
  map:        MapIcon,
  bookmark:   Bookmark,
  bookmarkOff:Bookmark,
  verified:   BadgeCheck,
  pin:        MapPin,
  sos:        Siren,
  nearMe:     Locate,
  street:     MapIcon,
  satellite:  Satellite,
  collapse:   ChevronUp,
  expand:     ChevronDown,
  close:      XIcon,
  directions: Navigation2,
  distance:   Ruler,
  you:        MapPin,
};

// ── Colors ─────────────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  teal:  { bg: "rgba(109,186,132,0.15)", text: "#6dba84" },
  amber: { bg: "rgba(224,133,60,0.15)",  text: "#e0853c" },
  red:   { bg: "rgba(224,92,110,0.15)",  text: "#e05c6e" },
  blue:  { bg: "rgba(188,194,255,0.12)", text: "#bcc2ff" },
};
function tagColor(tag: string) {
  if (["Crisis","24/7","Suicide","MHPSS","Trauma","PFA","Peer","Youth"].some(k=>tag.includes(k))) return TAG_COLORS.teal;
  if (["Family","Parenting","Outreach","Community","Drug","Women","Children"].some(k=>tag.includes(k))) return TAG_COLORS.amber;
  if (["Emergency","Acute"].some(k=>tag.includes(k))) return TAG_COLORS.red;
  return TAG_COLORS.blue;
}
function typeGlyph(type: string) {
  if (type==="Psychiatrist") return G.person;
  if (type.includes("Campus")) return G.campus;
  if (type==="Hospital") return G.hospital;
  if (type==="Hotline") return G.hotline;
  return G.support;
}
function typeColor(type: string) {
  if (type==="Psychiatrist") return "#bcc2ff";
  if (type.includes("Campus")) return "#6dba84";
  if (type==="NGO"||type==="Clinic") return "#e0853c";
  return "#bcc2ff";
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDist(km: number) { return km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)}km`; }

// ── Database ───────────────────────────────────────────────────────────────────
const DB_PSY: Provider[] = [
  { id:"psy_0001", name:"Dr. Japhet Fernandez De Leon", type:"Psychiatrist", clinic:"Iloilo Doctors' Hospital", city:"Iloilo City", tags:["Psychiatry","Adult Care","Assessment"], phone:"+63-33-337-7702", verified:true, lat:10.697364579578656, lng:122.5542997364835 },
  { id:"psy_0002", name:"Dr. Henrietta Española", type:"Psychiatrist", clinic:"St. Paul's Hospital Iloilo", city:"Iloilo City", tags:["Psychiatry","Therapy"], phone:null, verified:true, lat:10.702109073072572, lng:122.5668240306581 },
  { id:"psy_0003", name:"Dr. Donaldo Nicanor Tugbang", type:"Psychiatrist", clinic:"Iloilo Medical Center", city:"Iloilo City", tags:["Psychiatry","Diagnostics"], phone:"+63-33-337-1283", verified:true, lat:10.702198349378662, lng:122.56798242667763 },
  { id:"psy_0004", name:"Dr. Evony Allisa-Deveza", type:"Psychiatrist", clinic:"WVSU Medical Center", city:"Iloilo City", tags:["Psychiatry","WVSU"], phone:"+63-33-320-2431", phone2:"+63-33-332-0037", verified:true, fb:"https://web.facebook.com/ZSODIAGNOSTIC", lat:10.716144858647683, lng:122.56127087344781, locations:[{label:"WVSU Medical Center, E. Lopez St.", lat:10.716144858647683, lng:122.56127087344781},{label:"ZSO Diagnostic, E. Lopez San Vicente, Jaro", lat:10.720540445791599, lng:122.55944990949331}] },
  { id:"psy_0005", name:"Dr. Elysse Jane Magalona", type:"Psychiatrist", clinic:"Western Visayas Medical Center", city:"Iloilo City", tags:["Psychiatry","Government"], phone:"+63-33-330-7700", verified:true, lat:10.718980363764818, lng:122.5415419518234 },
  { id:"psy_0006", name:"Dr. Ryzameil Andrea Uy-Pesqueria", type:"Psychiatrist", clinic:"WVSU / Situbal / IMC", city:"Iloilo City", tags:["Psychiatry","Multi-clinic"], phone:"+63-905-021-8240", verified:true, lat:10.716144858647683, lng:122.56127087344781, locations:[{label:"WVSU Medical Center, E. Lopez St., Iloilo", lat:10.716144858647683, lng:122.56127087344781},{label:"Situbal Medical Clinic, PC Barracks Rd., Hamtic, Antique", lat:10.701498645547607, lng:121.98175786716308},{label:"Iloilo Medical Center, Bonifacio Dr., Danao", lat:10.702208891593429, lng:122.56787513832813}] },
  { id:"psy_0007", name:"Dr. Jeffrey Gellada", type:"Psychiatrist", clinic:"Healthlink Iloilo", city:"Iloilo City", tags:["Psychiatry","Clinic"], phone:"+63-935-090-6655", verified:true, lat:10.698928509093047, lng:122.56464941133775 },
  { id:"psy_0008", name:"Dr. Arlene Resano", type:"Psychiatrist", clinic:"Balajadia Clinic / San Antonio Clinic", city:"Iloilo City", tags:["Psychiatry","Multi-clinic"], phone:"+63-932-870-2765", phone2:"+63-939-100-3040", verified:true, lat:10.718274039293961, lng:122.5372678959981, locations:[{label:"Balajadia Medical Clinic, Young Arcade, Q. Abeto St., Manduriao", lat:10.718274039293961, lng:122.5372678959981},{label:"San Antonio Medical & Diagnostic Clinic, Banguit, Cabatuan, Iloilo", lat:10.870333397848897, lng:122.4932412978441}] },
  { id:"psy_0009", name:"Dr. Eunice Sermonia", type:"Psychiatrist", clinic:"Healthlink Iloilo Inc.", city:"Iloilo City", tags:["Psychiatry","Clinic"], phone:"+63-33-336-5434", verified:true, lat:10.698970678404713, lng:122.56471378434745 },
  { id:"psy_0010", name:"Dr. Karey Lois Charisse Valencia", type:"Psychiatrist", clinic:"Western Visayas Medical Center", city:"Iloilo City", tags:["Psychiatry","WVMC"], phone:"+63-945-103-1819", phone2:"+63-931-025-1276", verified:true, lat:10.718885489071514, lng:122.54161705366809 },
  { id:"psy_0011", name:"Dr. Diosdado Amargo Jr.", type:"Psychiatrist", clinic:"St. Paul's Hospital Iloilo", city:"Iloilo City", tags:["Psychiatry"], verified:true, lat:10.702045819757567, lng:122.56684548832798 },
  { id:"psy_0012", name:"Dr. Leah Florence Sicad", type:"Psychiatrist", clinic:"Capiz Doctors Hospital", city:"Roxas City", tags:["Psychiatry","Capiz"], phone:"+63-36-621-0429", verified:true, lat:11.565678631578253, lng:122.75275245183066 },
  { id:"psy_0013", name:"Dr. April Rose Hechanova-Espinosa", type:"Psychiatrist", clinic:"Trivi Building Clinic", city:"Bacolod City", tags:["Psychiatry","Bacolod"], verified:true, lat:10.667257592488145, lng:122.94279422114334 },
  { id:"psy_0014", name:"Dr. Julius Paul Juen", type:"Psychiatrist", clinic:"Metro Bacolod Hospital", city:"Bacolod City", tags:["Psychiatry","Bacolod"], phone:"+63-34-468-2100", phone2:"+63-34-488-7288", verified:true, fb:"https://www.facebook.com/MBHMCofficial/", lat:10.69668593766049, lng:122.96130192667749, locations:[{label:"Maxicare Primary Care Center, Lacson St., Mandalagan, Bacolod", lat:10.69668593766049, lng:122.96130192667749},{label:"The Doctors Hospital, Bacolod City", lat:10.678318407382848, lng:122.96041512483279},{label:"Metro Bacolod Hospital & Medical Center, Burgos Ext., Estefania", lat:10.661426569441243, lng:122.98495610764836}] },
  { id:"psy_0015", name:"Dr. Harlea Bancoleta", type:"Psychiatrist", clinic:"Corazon Locsin Montelibano Hospital", city:"Bacolod City", tags:["Psychiatry","Bacolod"], verified:true, lat:10.6723332652727, lng:122.95103691133772 },
  { id:"psy_0016", name:"Dr. Cherryl Velasco-Francia", type:"Psychiatrist", clinic:"VLI The Medical Plaza", city:"Bacolod City", tags:["Psychiatry","Bacolod"], phone:"+63-34-434-9001", verified:true, lat:10.676655789005393, lng:122.96052114446319 },
  { id:"psy_0017", name:"Dr. Eufemio Sobrevega", type:"Psychiatrist", clinic:"Iloilo Doctors' Hospital", city:"Iloilo City", tags:["Psychiatry"], phone:"+63-33-337-5320", verified:true, lat:10.697348776549134, lng:122.55441775767288 },
  { id:"psy_0018", name:"Dr. Euriz Calmerin", type:"Psychiatrist", clinic:"Metro Bacolod Hospital", city:"Bacolod City", tags:["Psychiatry","Bacolod"], phone:"+63-34-488-7288", verified:true, lat:10.661411906532729, lng:122.9849669338003 },
  { id:"psy_0019", name:"Dr. Anna Natalia Nina Tayo", type:"Psychiatrist", clinic:"Healthlink Iloilo", city:"Iloilo City", tags:["Psychiatry"], phone:"+63-912-529-1311", verified:true, lat:10.698921194746818, lng:122.56254851818348 },
  { id:"psy_0020", name:"Dr. Victor Amantillo", type:"Psychiatrist", clinic:"St. Paul's Hospital Iloilo", city:"Iloilo City", tags:["Psychiatry","PPA"], phone:"+63-33-337-2741", verified:true, lat:10.702122599988705, lng:122.56684148658569 },
];
const DB_COMM: Provider[] = [
  { id:"grp_0001", name:"PMHA Negros Occidental Chapter", type:"Community Program", clinic:"Cottage Road, Bacolod City", city:"Bacolod City", tags:["Mental Health","Education","Outreach"], email:"pmha_bacolod@yahoo.com.ph", verified:true, lat:10.674274233924532, lng:122.95061462672369 },
  { id:"grp_0002", name:"Sunshine Care Foundation", type:"NGO", clinic:"Metro Iloilo & Roxas City", city:"Iloilo City", tags:["Movement Disorders","Advocacy"], phone:"+63-917-841-4234", verified:true, lat:10.762882652821062, lng:122.58094578989117, locations:[{label:"Metro Iloilo Medical Center, Metropolis Ave., Iloilo City", lat:10.762882652821062, lng:122.58094578989117},{label:"The Health Centrum, Teodorica Ave., Banica, Roxas City", lat:11.581415121674768, lng:122.76791217301859}] },
  { id:"grp_0003", name:"PRIME Helpline Iloilo", type:"Community Program", clinic:"Casa Real de Iloilo, Gen. Luna St.", city:"Iloilo City", tags:["Crisis Support","24/7","Suicide Prevention"], phone:"+63-968-855-0997", phone2:"+63-966-241-8133", fb:"https://www.facebook.com/primehelpline", verified:true, lat:10.702072708877559, lng:122.5691675865093 },
  { id:"grp_0004", name:"WVMC Dept. of Psychiatry", type:"Hospital", clinic:"Q. Abeto St., Mandurriao", city:"Iloilo City", tags:["Acute Care","Outpatient","Government"], phone:"+63-33-330-7700", phone2:"+63-2-894-2-6843", verified:true, lat:10.71823721240049, lng:122.54264235767286 },
  { id:"grp_0005", name:"Pototan Mental Health Unit", type:"Hospital", clinic:"Iloilo-Capiz Road, Pototan", city:"Iloilo City", tags:["Inpatient","Outpatient"], phone:"+63-981-814-0312", verified:true, lat:10.928133852744487, lng:122.63015961720079 },
  { id:"grp_0006", name:"Bacolod Mental Health Center", type:"Hospital", clinic:"Burgos-Lacson St., Bacolod City", city:"Bacolod City", tags:["Neuropsych","Family Therapy","Emergency"], phone:"+63-34-446-0474", verified:true, lat:10.619663135077806, lng:122.9999250822294 },
  { id:"grp_0007", name:"USA Guidance & Counseling", type:"Campus Support", clinic:"Univ. of San Agustin, Gen. Luna St.", city:"Iloilo City", tags:["Student Support","Peer","Career"], phone:"+63-951-189-6559", verified:true, lat:10.699697832647951, lng:122.5628625558178 },
  { id:"grp_0008", name:'WVSU "Taltal" Program', type:"Campus Support", clinic:"West Visayas State University", city:"Iloilo City", tags:["Student","Counseling","Well-being"], phone:null, verified:true, lat:10.71388230715029, lng:122.56249237487366 },
  { id:"grp_0009", name:"Teen Center 2.0 Iloilo", type:"Community Program", clinic:"Iloilo Provincial Capitol (PSWDO)", city:"Iloilo City", tags:["Youth","Adolescent","Peer Counseling"], verified:true, lat:10.702489752153184, lng:122.56924331195957 },
  { id:"grp_0010", name:"DOH DATRC Pototan", type:"Community Program", clinic:"Brgy. Rumbang, Pototan", city:"Iloilo City", tags:["Drug Rehab","Residential","Therapeutic"], phone:"+63-33-529-8955", verified:true, lat:10.929183951980265, lng:122.62984182698138 },
  { id:"grp_0011", name:"PGCA Western Visayas", type:"Community Program", clinic:"University of San Agustin", city:"Iloilo City", tags:["Professional","Advocacy","Referral"], email:"pgca.iloilo.chapter@gmail.com", verified:true, lat:10.700005087363353, lng:122.56315298482635 },
  { id:"grp_0012", name:"Project Paglaum (CHO)", type:"Community Program", clinic:"Iloilo City Health Office, Mabini St.", city:"Iloilo City", tags:["MHPSS","Trauma","LGU"], verified:true, lat:10.694786608311848, lng:122.5729591413271 },
  { id:"grp_0013", name:"Family Life Center (CPU)", type:"Campus Support", clinic:"Central Philippine University, Jaro", city:"Iloilo City", tags:["Family Counseling","Parenting","Spiritual"], verified:true, lat:10.731568929722172, lng:122.5469395865857 },
  { id:"grp_0014", name:"Antique MHPSS Network", type:"Community Program", clinic:"Municipal Health Office, San Jose", city:"Antique", tags:["Crisis Response","PFA","Awareness"], email:"mhosanjose06@gmail.com", verified:true, lat:10.755760096736058, lng:121.94189515392358 },
];
const DB_SUP: Provider[] = [
  { id:"sup_0001", name:"Agubayani", type:"Trusted Support", clinic:"Iloilo City", city:"Iloilo City", tags:["Mental Health","Youth","Community"], phone:"+63-906-246-4502", fb:"https://www.facebook.com/agubayani", verified:true, lat:10.7302, lng:122.5591 },
  { id:"sup_0002", name:"CAMELEON Association Philippines", type:"NGO", clinic:"Passi City", city:"Passi City", tags:["Trauma Care","Art Therapy","Women"], phone:"+63-33-329-2309", verified:true, lat:11.108947673597761, lng:122.64284466199415 },
  { id:"sup_0003", name:"St. Brigid Wellness Center", type:"Clinic", clinic:"Brgy. San Rafael, Mandurriao", city:"Iloilo City", tags:["Wellness","Collaborative Care"], phone:"+63-942-096-9168", fb:"https://www.facebook.com/p/St-Brigid-Wellness-Center-Iloilo-100088977521968/", verified:true, lat:10.683236439214532, lng:122.53099501140379 },
  { id:"sup_0004", name:"DSWD Field Office VI", type:"Trusted Support", clinic:"M.H. del Pilar St., Molo, Iloilo", city:"Iloilo City", tags:["Psychosocial","Emergency","Referral"], phone:"+63-33-330-7860", verified:true, lat:10.698425704874138, lng:122.54757374532636 },
  { id:"sup_0005", name:"FPOP Iloilo Chapter", type:"NGO", clinic:"Rizal St., Iloilo City", city:"Iloilo City", tags:["Family Planning","Referral"], phone:"+63-33-509-8846", verified:true, lat:10.69203779499814, lng:122.56854072698141 },
  { id:"sup_0006", name:"Healthway QualiMed Women & Children", type:"Clinic", clinic:"Atria Park District, Mandurriao", city:"Iloilo City", tags:["Women","Children","Psychiatric"], verified:true, lat:10.706738231006216, lng:122.54558354616391 },
  { id:"sup_0007", name:"PHINMA University of Iloilo", type:"Campus Support", clinic:"Student Services", city:"Iloilo City", tags:["Student","Anxiety","Free Sessions"], fb:"https://web.facebook.com/uicsdl/", verified:true, lat:10.701270257516247, lng:122.56250085026352 },
  { id:"sup_0008", name:"WVSU Center for Mindfulness", type:"Campus Support", clinic:"West Visayas State University", city:"Iloilo City", tags:["Mindfulness","Outreach","Community"], phone:"+63-33-320-0870", verified:true, lat:10.715184351930294, lng:122.56198585383945 },
  { id:"sup_0009", name:"Hua Siong Guidance Program", type:"Campus Support", clinic:"Hua Siong College of Iloilo", city:"Iloilo City", tags:["Student","Counseling","Testing"], phone:"+63-33-337-3679", phone2:"+63-33-335-0145", verified:true, lat:10.697113310167406, lng:122.56901465366786 },
  { id:"sup_0010", name:"Peer Helpers Network (LGU)", type:"Community Program", clinic:"Iloilo City LGU", city:"Iloilo City", tags:["Peer Support","Youth","Community"], phone:"+63-968-566-3131", verified:true, lat:10.694287756747556, lng:122.57307009631039 },
  { id:"sup_0011", name:"USA Guidance Center", type:"Campus Support", clinic:"University of San Agustin", city:"Iloilo City", tags:["Walk-in","Group Counseling","Academic"], phone:"+63-951-189-6559", verified:true, lat:10.701270257516247, lng:122.56250085026352 },
];
const DB_HOT: Provider[] = [
  { id:"hot_0001", name:"PRIME Mental Health Helpline", type:"Hotline", clinic:"", city:"Iloilo Province", tags:["Crisis Support","24/7"], phone:"+63-968-855-0997", fb:"https://www.facebook.com/primehelpline", verified:true, hours:"24/7", coverage:"Iloilo Province" },
  { id:"hot_0002", name:"AH Connect – DOH Western Visayas", type:"Hotline", clinic:"", city:"Region 6", tags:["Crisis Support","Referral"], phone:"+63-917-775-9256", verified:true, hours:"TBC", coverage:"Region 6" },
  { id:"hot_0003", name:"WVMC Mental Health Hotline", type:"Hotline", clinic:"", city:"Iloilo City", tags:["Crisis Support"], phone:"+63-931-025-1276", verified:true, hours:"TBC", coverage:"Iloilo City" },
  { id:"hot_0004", name:"NCMH Crisis Line", type:"Hotline", clinic:"", city:"National", tags:["Crisis Support","24/7","Suicide Prevention"], phone:"+63-917-899-8727", verified:true, hours:"24/7", coverage:"National" },
  { id:"hot_0005", name:"Hopeline Philippines", type:"Hotline", clinic:"", city:"National", tags:["Crisis Support","24/7","Suicide Prevention"], phone:"+63-917-558-4673", verified:true, hours:"24/7", coverage:"National" },
];

const CITIES = ["Iloilo City","Bacolod City","Roxas City","Antique","Passi City"];
const TILES = {
  street:    { url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr:"© OpenStreetMap, © CARTO" },
  satellite: { url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr:"© Esri" },
};

function estimateTime(km: number): string {
  const walkMin = Math.round((km / 5) * 60);
  const driveMin = Math.round((km / 40) * 60);
  if (km < 0.5) return `~${walkMin} min walk`;
  if (km < 3)   return `~${walkMin} min walk · ~${driveMin} min drive`;
  return `~${driveMin} min drive`;
}

// ── Live Map ───────────────────────────────────────────────────────────────────
function LiveMap({ providers, focusProvider, userLocation, mapLayer, onLayerChange, onCollapse, onResetFocus }: {
  providers: Provider[]; focusProvider: Provider | null;
  userLocation: UserLocation | null; mapLayer: MapLayer;
  onLayerChange: (l: MapLayer) => void;
  onCollapse?: () => void;
  onResetFocus?: (() => void) | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!mapRef.current || ready.current) return;
    ready.current = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      leafletRef.current = L;
      const map = L.map(mapRef.current!, { center:[10.78,122.65], zoom:9, zoomControl:false });
      L.control.zoom({ position:"bottomright" }).addTo(map);
      tileLayerRef.current = L.tileLayer(TILES.street.url, { attribution:TILES.street.attr, maxZoom:19 }).addTo(map);
      mapInstance.current = map;
      rebuildMarkers(L, map, providers);
    };
    document.head.appendChild(script);
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; ready.current = false; } };
  }, []);

  useEffect(() => {
    const L = leafletRef.current; const map = mapInstance.current;
    if (!L || !map) return;
    rebuildMarkers(L, map, providers);
  }, [providers]);

  useEffect(() => {
    const L = leafletRef.current; const map = mapInstance.current;
    if (!L || !map || !focusProvider?.lat || !focusProvider?.lng) return;
    if (userLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [focusProvider.lat, focusProvider.lng]
      );
      map.fitBounds(bounds.pad(0.3), { animate:true, duration:1.2 });
    } else {
      map.flyTo([focusProvider.lat, focusProvider.lng], 16, { animate:true, duration:1.2 });
    }
    const marker = markersRef.current.get(focusProvider.id);
    if (marker) setTimeout(() => marker.openPopup(), 1400);
  }, [focusProvider, userLocation]);

  useEffect(() => {
    const L = leafletRef.current; const map = mapInstance.current;
    if (!L || !map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILES[mapLayer].url, { attribution:TILES[mapLayer].attr, maxZoom:19 }).addTo(map);
  }, [mapLayer]);

  useEffect(() => {
    const L = leafletRef.current; const map = mapInstance.current;
    if (!L || !map || !userLocation) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const icon = L.divIcon({
      html:`<div style="width:16px;height:16px;border-radius:50%;background:#4a9eff;border:3px solid #fff;box-shadow:0 0 0 4px rgba(74,158,255,0.3);"></div>`,
      className:"", iconSize:[16,16], iconAnchor:[8,8],
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon })
      .addTo(map).bindPopup("<b>You are here</b>");
    map.flyTo([userLocation.lat, userLocation.lng], 13, { animate:true, duration:1.5 });
  }, [userLocation]);

  function pinColor(p: Provider) {
    if (p.type==="Psychiatrist") return "#bcc2ff";
    if (p.type==="Hotline") return "#e05c6e";
    if (p.type==="Hospital"||p.type==="Community Program") return "#6dba84";
    if (p.type.includes("Campus")) return "#6dba84";
    return "#e0853c";
  }

  function rebuildMarkers(L: any, map: any, list: Provider[]) {
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current.clear();

    list.filter(p => p.lat && p.lng).forEach(p => {
      const color = pinColor(p);
      const letter = p.type === "Psychiatrist" ? "P"
        : p.type.includes("Campus") ? "C"
        : p.type === "Hospital" ? "H"
        : p.type === "Hotline" ? "S"
        : "•";
      const icon = L.divIcon({
        html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#121416;box-shadow:0 2px 10px rgba(0,0,0,0.6);font-family:'Plus Jakarta Sans', system-ui, sans-serif;">${letter}</div>`,
        className:"", iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
      });
      const marker = L.marker([p.lat!, p.lng!], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:190px;padding:2px 0;">
          <div style="font-weight:700;font-size:13px;color:#121416;margin-bottom:3px;line-height:1.3;">${p.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:2px;">${p.type}</div>
          ${p.clinic ? `<div style="font-size:11px;color:#888;margin-bottom:8px;">${p.clinic}</div>` : ""}
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${p.phone ? `<a href="tel:${p.phone}" style="background:#121416;color:#bcc2ff;padding:5px 10px;border-radius:6px;font-size:11px;text-decoration:none;font-weight:600;">Call</a>` : ""}
            ${p.lat && p.lng ? `<a href="https://maps.google.com/?saddr=Current+Location&daddr=${p.lat},${p.lng}&dirflg=d" target="_blank" style="background:#1a73e8;color:#fff;padding:5px 10px;border-radius:6px;font-size:11px;text-decoration:none;font-weight:600;">Directions</a>` : ""}
          </div>
        </div>`, { maxWidth: 220 });
      markersRef.current.set(p.id, marker);
    });
  }

  return (
    <div style={{ position:"relative" }}>
      <div ref={mapRef} style={{ width:"100%", height:230, background:"#1a1c22" }} />
      <div style={{ position:"absolute", top:10, left:10, zIndex:1000, display:"flex", borderRadius:8, overflow:"hidden", border:"1.5px solid rgba(255,255,255,0.2)", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
        {(["street","satellite"] as MapLayer[]).map(l => {
          const Icon = l === "street" ? G.street : G.satellite;
          return (
            <button key={l} onClick={()=>onLayerChange(l)} style={{ padding:"6px 12px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:600, background:mapLayer===l?"#bcc2ff":"rgba(18,20,22,0.85)", color:mapLayer===l?"#121416":"rgba(255,255,255,0.7)", transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:5 }}>
              <Icon size={12} />
              {l === "street" ? "Street" : "Satellite"}
            </button>
          );
        })}
      </div>
      {(onCollapse || onResetFocus) && (
        <div style={{ position:"absolute", bottom:12, right:12, zIndex:1000, display:"flex", gap:6 }}>
          {onResetFocus && (
            <button onClick={onResetFocus} aria-label="Reset focused provider"
              style={{ height:30, padding:"0 10px", borderRadius:8, background:"rgba(18,20,22,0.85)", border:"1px solid rgba(188,194,255,0.18)", color:"rgba(188,194,255,0.7)", fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
              <G.close size={12} /> Reset
            </button>
          )}
          {onCollapse && (
            <button onClick={onCollapse} aria-label="Collapse map"
              style={{ height:30, padding:"0 10px", borderRadius:8, background:"rgba(18,20,22,0.85)", border:"1px solid rgba(188,194,255,0.18)", color:"#bcc2ff", fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
              <G.collapse size={12} /> Collapse
            </button>
          )}
        </div>
      )}
      <div
        aria-label="Region 6, Western Visayas"
        style={{
          position: "absolute",
          left: 10,
          bottom: 12,
          zIndex: 1000,
          height: 30,
          padding: "0 10px",
          borderRadius: 8,
          background: "rgba(18,20,22,0.85)",
          border: "1px solid rgba(188,194,255,0.18)",
          color: "rgba(188,194,255,0.7)",
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          pointerEvents: "none",
          maxWidth: "calc(100% - 20px)",
        }}
      >
        <G.pin size={12} color="#bcc2ff" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Region 6 · Western Visayas
        </span>
      </div>
    </div>
  );
}

// ── Tag chip ───────────────────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  const c = tagColor(label);
  return <span style={{ background:c.bg, color:c.text, fontSize:10, padding:"3px 8px", borderRadius:20, fontWeight:500 }}>{label}</span>;
}

// ── Provider Card ──────────────────────────────────────────────────────────────
function ProviderCard({ e, saved, onSave, onFocus, onDetail, isFocused, distKm }: {
  e: Provider; saved: boolean; onSave:(id:string)=>void;
  onFocus:(p:Provider)=>void; onDetail:(p:Provider)=>void; isFocused:boolean; distKm?:number;
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { if (isFocused) setExpanded(true); }, [isFocused]);
  const hasMap = !!(e.lat && e.lng);
  const tc = typeColor(e.type);

  const TypeIcon = typeGlyph(e.type);

  return (
    <div style={{ background:isFocused?"rgba(188,194,255,0.06)":"#161820", margin:"0 0 1px", padding:"13px 16px", borderBottom:"1px solid rgba(188,194,255,0.06)", borderLeft:isFocused?"2px solid #bcc2ff":"2px solid transparent", cursor:"pointer", transition:"all 0.2s" }}
      onClick={()=>{ setExpanded(x=>!x); if(hasMap) onFocus(e); }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        {/* Icon */}
        <div style={{
          width:40, height:40, borderRadius:11, flexShrink:0,
          background: isFocused
            ? `${tc}22`
            : e.type==="Psychiatrist" ? "rgba(188,194,255,0.1)"
            : e.type.includes("Campus") ? "rgba(109,186,132,0.1)"
            : e.type==="Hospital" ? "rgba(109,186,132,0.1)"
            : e.type==="NGO" || e.type==="Clinic" ? "rgba(224,133,60,0.1)"
            : "rgba(188,194,255,0.08)",
          border: `1px solid ${tc}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:tc, transition:"all 0.2s",
        }}>
          <TypeIcon size={18} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#e8eaff", lineHeight:1.3, marginBottom:2 }}>{e.name}</div>
          <div style={{ fontSize:11, color:tc, fontWeight:500, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
            <span>{e.type} · {e.city}</span>
            {distKm!==undefined && (
              <span style={{ color:"rgba(220,224,255,0.6)", fontWeight:400, fontSize:10, display:"inline-flex", alignItems:"center", gap:3 }}>
                <G.distance size={10} /> {fmtDist(distKm)}
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {e.tags.slice(0,2).map(t=><Tag key={t} label={t}/>)}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {hasMap && (
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); onFocus(e); }}
                aria-label="Show on map"
                title="Show on map"
                style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: isFocused ? "rgba(188,194,255,0.10)" : "transparent",
                  border: "none",
                  color: isFocused ? "#bcc2ff" : "rgba(188,194,255,0.35)",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(ev) => {
                  if (!isFocused) {
                    ev.currentTarget.style.background = "rgba(188,194,255,0.06)";
                    ev.currentTarget.style.color = "rgba(188,194,255,0.7)";
                  }
                }}
                onMouseLeave={(ev) => {
                  if (!isFocused) {
                    ev.currentTarget.style.background = "transparent";
                    ev.currentTarget.style.color = "rgba(188,194,255,0.35)";
                  }
                }}
              >
                <G.pin size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={(ev) => { ev.stopPropagation(); onSave(e.id); }}
              aria-label={saved ? "Remove from saved" : "Save provider"}
              aria-pressed={saved}
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: "transparent",
                border: "none",
                color: saved ? "#bcc2ff" : "rgba(188,194,255,0.35)",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(ev) => {
                if (!saved) {
                  ev.currentTarget.style.background = "rgba(188,194,255,0.06)";
                  ev.currentTarget.style.color = "rgba(188,194,255,0.7)";
                }
              }}
              onMouseLeave={(ev) => {
                if (!saved) {
                  ev.currentTarget.style.background = "transparent";
                  ev.currentTarget.style.color = "rgba(188,194,255,0.35)";
                }
              }}
            >
              <G.bookmark size={16} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          {e.verified && <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:9, color:"#6dba84", fontWeight:700, letterSpacing:"0.5px" }}><G.verified size={10} /> VERIFIED</span>}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid rgba(188,194,255,0.06)" }}>
          {/* Clinic info */}
          {e.clinic
            ? <div style={{ fontSize:11, color:"rgba(220,224,255,0.7)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}><G.hospital size={12} /> {e.clinic}</div>
            : <div style={{ fontSize:11, color:"rgba(220,224,255,0.6)", marginBottom:10, fontStyle:"italic" }}>Contact via walk-in or referral</div>
          }
          {/* Action buttons */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {e.phone && e.phone2 ? (
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                <div style={{ fontSize:9, color:"rgba(220,224,255,0.6)", fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase" }}>Select number to call:</div>
                <a href={`tel:${e.phone}`} onClick={ev=>ev.stopPropagation()}
                  style={{ height:34, borderRadius:8, background:"rgba(188,194,255,0.08)", color:"#bcc2ff", border:"1px solid rgba(188,194,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, textDecoration:"none", fontSize:11, fontWeight:600 }}>
                  <G.phone size={12} /> {e.phone}
                </a>
                <a href={`tel:${e.phone2}`} onClick={ev=>ev.stopPropagation()}
                  style={{ height:34, borderRadius:8, background:"rgba(188,194,255,0.05)", color:"rgba(188,194,255,0.6)", border:"1px solid rgba(188,194,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, textDecoration:"none", fontSize:11, fontWeight:600 }}>
                  <G.phone size={12} /> {e.phone2}
                </a>
              </div>
            ) : e.phone ? (
              <a href={`tel:${e.phone}`} onClick={ev=>ev.stopPropagation()}
                style={{ flex:1, minWidth:80, height:36, borderRadius:8, background:"rgba(188,194,255,0.08)", color:"#bcc2ff", border:"1px solid rgba(188,194,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, textDecoration:"none", fontSize:12, fontWeight:600 }}>
                <G.phone size={14} /> Call
              </a>
            ) : (
              <div style={{ flex:1, minWidth:80, height:36, borderRadius:8, background:"rgba(188,194,255,0.03)", border:"1px solid rgba(188,194,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"rgba(220,224,255,0.6)" }}>
                No number
              </div>
            )}
            {/* Share button */}
            <button onClick={async ev=>{ ev.stopPropagation();
              const text = [e.name, e.type, e.clinic, e.city, e.phone].filter(Boolean).join(" · ");
              try { await navigator.clipboard.writeText(text); } catch {}
              const btn = ev.currentTarget as HTMLButtonElement;
              const orig = btn.innerHTML;
              btn.innerHTML = "Copied!";
              setTimeout(() => { btn.innerHTML = orig; }, 1500);
            }}
              aria-label="Copy provider info"
              style={{ width:36, height:36, borderRadius:8, background:"rgba(188,194,255,0.06)", color:"rgba(220,224,255,0.7)", border:"1px solid rgba(188,194,255,0.12)", cursor:"pointer", flexShrink:0, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              <ClipboardCopy size={14} />
            </button>
            <button onClick={ev=>{ ev.stopPropagation(); onDetail(e); }}
              style={{ flex:1, minWidth:80, height:36, borderRadius:8, background:"rgba(188,194,255,0.12)", color:"#bcc2ff", border:"1px solid rgba(188,194,255,0.25)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>
              Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hotline Card ───────────────────────────────────────────────────────────────
function HotlineCard({ h }: { h: Provider }) {
  return (
    <div style={{ background:"rgba(224,92,110,0.05)", margin:"0 0 1px", padding:"12px 16px", borderBottom:"1px solid rgba(224,92,110,0.08)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(224,92,110,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#e05c6e", flexShrink:0 }}>
        <G.sos size={18} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#e8eaff", marginBottom:2 }}>{h.name}</div>
        <div style={{ fontSize:10, color:"rgba(220,224,255,0.65)" }}>{h.phone} · {h.coverage} · {h.hours}</div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {h.fb && <a href={h.fb} target="_blank" rel="noreferrer" aria-label="Facebook" style={{ width:32, height:32, borderRadius:8, background:"rgba(59,89,152,0.18)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:11, color:"#8b9dc3", fontWeight:700 }}>fb</a>}
        {h.phone && <a href={`tel:${h.phone}`} aria-label="Call hotline" style={{ width:32, height:32, borderRadius:8, background:"#e05c6e", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", color:"#fff" }}><G.phone size={14} /></a>}
      </div>
    </div>
  );
}

// ── SOS Modal ─────────────────────────────────────────────────────────────────
function SOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ width:"100%", background:"#1a0a0a", borderRadius:"20px 20px 0 0", padding:"24px 20px 44px", border:"1px solid rgba(224,92,110,0.25)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)", margin:"0 auto 20px" }} />
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"rgba(224,92,110,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#e05c6e" }}><G.sos size={20} /></div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#e05c6e" }}>Need immediate help?</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>Call any crisis line now</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {DB_HOT.map(h => (
            <a key={h.id} href={`tel:${h.phone}`}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(224,92,110,0.08)", border:"1px solid rgba(224,92,110,0.18)", borderRadius:12, padding:"12px 16px", textDecoration:"none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#e8eaff" }}>{h.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{h.phone} · {h.coverage}</div>
              </div>
              <div style={{ width:34, height:34, borderRadius:10, background:"#e05c6e", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}><G.phone size={16} /></div>
            </a>
          ))}
        </div>
        <button onClick={onClose} style={{ width:"100%", marginTop:14, padding:"14px", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", fontFamily:"inherit", fontSize:14, cursor:"pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}


// ── Detail Screen ──────────────────────────────────────────────────────────────
function DetailScreen({ e, onClose, distKm, userLocation, onFlyTo }: {
  e: Provider; onClose: () => void; distKm?: number; userLocation: any; onFlyTo: (lat: number, lng: number) => void;
}) {
  const [selectedLocIdx, setSelectedLocIdx] = useState(0);
  const tc = typeColor(e.type);
  const C = { bg:"#121416", surface:"#161820", border:"rgba(188,194,255,0.06)", text:"#e8eaff", muted:"rgba(188,194,255,0.4)", accent:"#bcc2ff" };
  const hasMultiLoc = !!(e.locations && e.locations.length > 1);
  const selectedLoc = hasMultiLoc ? e.locations![selectedLocIdx] : null;
  const activeLat = selectedLoc?.lat ?? e.lat;
  const activeLng = selectedLoc?.lng ?? e.lng;
  const TypeIcon = typeGlyph(e.type);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:C.bg, display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 0", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontFamily:"inherit", fontSize:13, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6, padding:0, marginBottom:16 }}>
          <ChevronLeft size={14} /> Back to results
        </button>
        {/* Avatar */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"rgba(188,194,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", color:tc, flexShrink:0, border:`1.5px solid rgba(188,194,255,0.1)` }}>
            <TypeIcon size={26} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:4 }}>{e.name}</div>
            <div style={{ fontSize:12, color:tc, fontWeight:600, marginBottom:6 }}>{e.type}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {e.tags.map(t => <Tag key={t} label={t} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px" } as React.CSSProperties}>

        {/* Distance card — only when location known */}
        {distKm !== undefined && (
          <div style={{ background:"rgba(74,158,255,0.08)", border:"1px solid rgba(74,158,255,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
            <G.pin size={20} color="#4a9eff" />
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#4a9eff" }}>{fmtDist(distKm)} away</div>
              <div style={{ fontSize:11, color:"rgba(74,158,255,0.6)", marginTop:1 }}>{estimateTime(distKm)}</div>
            </div>
          </div>
        )}

        {/* Info rows */}
        <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:12 }}>
          {e.clinic && (
            <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12, alignItems:"flex-start" }}>
              <G.hospital size={14} color={C.muted} />
              <div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:2 }}>Clinic / Location</div>
                <div style={{ fontSize:13, color:C.text }}>{e.clinic}</div>
              </div>
            </div>
          )}
          <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12, alignItems:"flex-start" }}>
            <G.pin size={14} color={C.muted} />
            <div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:2 }}>City</div>
              <div style={{ fontSize:13, color:C.text }}>{e.city}</div>
            </div>
          </div>
          {e.phone && (
            <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12, alignItems:"flex-start" }}>
              <G.phone size={14} color={C.muted} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:2 }}>Phone</div>
                <div style={{ fontSize:13, color:C.text }}>{e.phone}</div>
                {e.phone2 && <div style={{ fontSize:12, color:"rgba(188,194,255,0.5)", marginTop:3 }}>{e.phone2}</div>}
              </div>
              <button onClick={async () => { await navigator.clipboard?.writeText(e.phone! + (e.phone2 ? " / " + e.phone2 : "")); }}
                style={{ background:"rgba(188,194,255,0.08)", border:"1px solid rgba(188,194,255,0.15)", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:10, color:C.accent, fontFamily:"inherit", fontWeight:600 }}>
                Copy
              </button>
            </div>
          )}
          {e.email && (
            <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12, alignItems:"flex-start" }}>
              <Mail size={14} color={C.muted} />
              <div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:2 }}>Email</div>
                <div style={{ fontSize:12, color:C.text }}>{e.email}</div>
              </div>
            </div>
          )}
          {e.verified && (
            <div style={{ padding:"13px 16px", display:"flex", gap:12, alignItems:"center" }}>
              <G.verified size={14} color="#6dba84" />
              <div>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:2 }}>Verification</div>
                <div style={{ fontSize:13, color:"#6dba84", fontWeight:600 }}>Verified provider</div>
              </div>
            </div>
          )}
        </div>

        {/* Location picker for multi-clinic providers */}
        {hasMultiLoc && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:8, display:"inline-flex", alignItems:"center", gap:5 }}>
              <G.pin size={11} /> Select Clinic Location
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {e.locations!.map((loc, idx) => (
                <button key={idx}
                  onClick={() => { setSelectedLocIdx(idx); onFlyTo(loc.lat, loc.lng); }}
                  style={{
                    background: selectedLocIdx === idx ? "rgba(188,194,255,0.12)" : C.surface,
                    border: `1.5px solid ${selectedLocIdx === idx ? "rgba(188,194,255,0.4)" : C.border}`,
                    borderRadius:10, padding:"10px 14px", cursor:"pointer",
                    fontFamily:"inherit", textAlign:"left", transition:"all 0.15s",
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                  <div style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0,
                    background: selectedLocIdx === idx ? "#bcc2ff" : "rgba(188,194,255,0.15)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:9, fontWeight:700,
                    color: selectedLocIdx === idx ? "#121416" : C.muted,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: selectedLocIdx === idx ? C.text : C.muted, lineHeight:1.3 }}>
                      {loc.label}
                    </div>
                    {userLocation && (
                      <div style={{ fontSize:10, color:"rgba(74,158,255,0.7)", marginTop:2 }}>
                        {fmtDist(haversineKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng))} away
                        {selectedLocIdx === idx && " · selected"}
                      </div>
                    )}
                  </div>
                  {selectedLocIdx === idx && (
                    <G.verified size={13} color="#bcc2ff" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {/* Share row */}
          <button onClick={async () => {
            const parts = [e.name, e.type, e.clinic, e.city, e.phone, e.email].filter(Boolean);
            const text = parts.join(" · ");
            try { await navigator.clipboard.writeText(text); } catch {}
            const btn = document.activeElement as HTMLButtonElement;
            if (btn) { const o = btn.textContent; btn.textContent = "Copied to clipboard!"; setTimeout(()=>{ btn.textContent = o; }, 1800); }
          }} style={{ height:40, borderRadius:10, background:"rgba(188,194,255,0.06)", color:"rgba(188,194,255,0.5)", border:"1px solid rgba(188,194,255,0.1)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <ClipboardCopy size={13} /> Copy provider info
          </button>
          {e.phone && e.phone2 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase" }}>Select number to call:</div>
              <a href={`tel:${e.phone}`}
                style={{ height:48, borderRadius:12, background:"rgba(188,194,255,0.1)", color:C.accent, border:"1px solid rgba(188,194,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
                <G.phone size={16} /> {e.phone}
              </a>
              <a href={`tel:${e.phone2}`}
                style={{ height:48, borderRadius:12, background:"rgba(188,194,255,0.06)", color:"rgba(188,194,255,0.6)", border:"1px solid rgba(188,194,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
                <G.phone size={16} /> {e.phone2}
              </a>
            </div>
          ) : e.phone ? (
            <a href={`tel:${e.phone}`}
              style={{ height:48, borderRadius:12, background:"rgba(188,194,255,0.1)", color:C.accent, border:"1px solid rgba(188,194,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
              <G.phone size={16} /> Call {e.name.split(" ").slice(0,2).join(" ")}
            </a>
          ) : (
            <div style={{ height:48, borderRadius:12, background:"rgba(188,194,255,0.03)", border:"1px solid rgba(188,194,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"rgba(220,224,255,0.6)" }}>
              No phone number — contact via walk-in or referral
            </div>
          )}
          {activeLat && activeLng && (
            <a href={`https://maps.google.com/?saddr=Current+Location&daddr=${activeLat},${activeLng}&dirflg=d`} target="_blank" rel="noreferrer"
              style={{ height:48, borderRadius:12, background:"rgba(26,115,232,0.12)", color:"#6aabff", border:"1px solid rgba(26,115,232,0.25)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
              <G.directions size={16} /> Get Directions
              {selectedLoc && <span style={{ fontSize:11, opacity:0.6, marginLeft:2 }}>· {selectedLoc.label.split(",")[0]}</span>}
            </a>
          )}
          {e.fb && (
            <a href={e.fb} target="_blank" rel="noreferrer"
              style={{ height:48, borderRadius:12, background:"rgba(59,89,152,0.12)", color:"#8b9dc3", border:"1px solid rgba(59,89,152,0.25)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
              <Globe size={16} /> View Facebook Page
            </a>
          )}
          {e.email && (
            <a href={`mailto:${e.email}`}
              style={{ height:48, borderRadius:12, background:"rgba(188,194,255,0.06)", color:C.accent, border:"1px solid rgba(188,194,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none", fontSize:14, fontWeight:600 }}>
              <Mail size={16} /> Send Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Recently Viewed ────────────────────────────────────────────────────────────
function RecentlyViewed({ ids, allProviders, onSelect }: {
  ids: string[]; allProviders: Provider[]; onSelect: (p: Provider) => void;
}) {
  if (ids.length === 0) return null;
  const C = { surface:"#161820", border:"rgba(188,194,255,0.06)", muted:"rgba(188,194,255,0.4)", accent:"#bcc2ff" };
  const recent = ids.map(id => allProviders.find(p => p.id === id)).filter(Boolean) as Provider[];

  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ padding:"14px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:"1px", textTransform:"uppercase" }}>Recently Viewed</span>
        <span style={{ fontSize:11, color:C.muted }}>{recent.length}</span>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 16px 12px", scrollbarWidth:"none" }}>
        {recent.map(p => {
          const TypeIcon = typeGlyph(p.type);
          return (
            <button key={p.id} onClick={() => onSelect(p)}
              style={{ flexShrink:0, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", minWidth:140, maxWidth:160 }}>
              <div style={{ color:typeColor(p.type), marginBottom:4 }}><TypeIcon size={16} /></div>
              <div style={{ fontSize:11, fontWeight:600, color:"#e8eaff", lineHeight:1.3, marginBottom:2 }}>{p.name.split(",")[0]}</div>
              <div style={{ fontSize:10, color:C.muted }}>{p.city}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ── Saved Screen ───────────────────────────────────────────────────────────────
function SavedScreen({ savedIds, allProviders, onClose, onDetail, onFocus, getDistance }: {
  savedIds: Set<string>; allProviders: Provider[]; onClose: () => void;
  onDetail: (p: Provider) => void; onFocus: (p: Provider) => void;
  getDistance: (p: Provider) => number | undefined;
}) {
  const C = { bg:"#121416", surface:"#161820", border:"rgba(188,194,255,0.06)", text:"#e8eaff", muted:"rgba(188,194,255,0.4)", accent:"#bcc2ff" };
  const saved = allProviders.filter(p => savedIds.has(p.id));

  return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:C.bg, display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ padding:"16px 16px 12px", flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontFamily:"inherit", fontSize:13, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6, padding:0, marginBottom:14 }}>
          <ChevronLeft size={14} /> Back
        </button>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.text, margin:0 }}>Saved Resources</h2>
            <p style={{ fontSize:12, color:C.muted, margin:"4px 0 0" }}>{saved.length} saved provider{saved.length !== 1 ? "s" : ""}</p>
          </div>
          <G.bookmark size={22} color={C.accent} fill="currentColor" />
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto" } as React.CSSProperties}>
        {saved.length === 0 ? (
          <div style={{ padding:48, textAlign:"center" }}>
            <G.bookmark size={36} color={C.muted} style={{ marginBottom:12, opacity:0.3 }} />
            <div style={{ fontSize:14, color:C.muted, marginBottom:6 }}>No saved resources yet</div>
            <div style={{ fontSize:12, color:"rgba(220,224,255,0.6)" }}>Tap the bookmark on any provider to save them here</div>
          </div>
        ) : (
          saved.map(p => {
            const tc = typeColor(p.type);
            const dist = getDistance(p);
            const TypeIcon = typeGlyph(p.type);
            return (
              <div key={p.id}
                style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}
                onClick={() => { onDetail(p); onFocus(p); onClose(); }}>
                <div style={{
                  width:42, height:42, borderRadius:11, flexShrink:0,
                  background: p.type==="Psychiatrist" ? "rgba(188,194,255,0.1)" : p.type.includes("Campus")||p.type==="Hospital" ? "rgba(109,186,132,0.1)" : "rgba(224,133,60,0.1)",
                  border:`1px solid ${tc}30`,
                  display:"flex", alignItems:"center", justifyContent:"center", color:tc,
                }}>
                  <TypeIcon size={18} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:tc, fontWeight:500, marginBottom:3 }}>
                    {p.type} · {p.city}
                    {dist !== undefined && <span style={{ color:"rgba(220,224,255,0.65)", fontWeight:400 }}> · {fmtDist(dist)}</span>}
                  </div>
                  {p.phone && <div style={{ fontSize:11, color:"rgba(220,224,255,0.6)" }}>{p.phone}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                  {p.verified && <G.verified size={11} color="#6dba84" />}
                  <ChevronRight size={14} color="rgba(188,194,255,0.25)" />
                </div>
              </div>
            );
          })
        )}
        <div style={{ height:24 }} />
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, count, color }: { label:string; count:number; color:string }) {
  return (
    <div style={{ padding:"14px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:11, fontWeight:700, color:"rgba(220,224,255,0.7)", letterSpacing:"1px", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:11, color, fontWeight:700 }}>{count}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function GISFeature() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [focusProvider, setFocusProvider] = useState<Provider | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>("street");
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [sosOpen, setSosOpen] = useState(false);
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const openDetail = useCallback((p: Provider) => {
    setDetailProvider(p);
    setRecentIds(prev => {
      const filtered = prev.filter(id => id !== p.id);
      return [p.id, ...filtered].slice(0, 6);
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved(prev => { const next = new Set(prev); next.has(id)?next.delete(id):next.add(id); return next; });
  }, []);

  const handleNearMe = useCallback(() => {
    if (sortBy === "distance" && userLocation) {
      setSortBy("default");
      setUserLocation(null);
      setFocusProvider(null);
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat:pos.coords.latitude, lng:pos.coords.longitude });
        setSortBy("distance");
        setLocating(false);
        setMapCollapsed(false);
      },
      () => { setLocating(false); alert("Could not get your location. Please allow location access."); },
      { enableHighAccuracy:true, timeout:8000 }
    );
  }, [sortBy, userLocation]);

  const getDistance = useCallback((p: Provider): number | undefined => {
    if (!userLocation || !p.lat || !p.lng) return undefined;
    return haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
  }, [userLocation]);

  // Sort all sections by distance when Near Me is active
  const sortList = useCallback((arr: Provider[]) => {
    if (sortBy !== "distance" || !userLocation) return arr;
    return [...arr].sort((a, b) => (getDistance(a)??99999) - (getDistance(b)??99999));
  }, [sortBy, userLocation, getDistance]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    function f(arr: Provider[]) {
      const result = arr.filter(e => {
        const mc = !city || e.city === city;
        const mq = !q || e.name.toLowerCase().includes(q) || e.clinic.toLowerCase().includes(q) || e.tags.some(t=>t.toLowerCase().includes(q));
        return mc && mq;
      });
      return sortList(result);
    }
    return { psy: f(DB_PSY), comm: f(DB_COMM), sup: f(DB_SUP) };
  }, [search, city, sortList]);

  const mapProviders = useMemo(() => {
    if (tab==="hotline") return [];
    if (tab==="psychologist") return filtered.psy;
    if (tab==="community") return filtered.comm;
    if (tab==="support") return filtered.sup;
    return [...filtered.psy, ...filtered.comm, ...filtered.sup];
  }, [tab, filtered]);

  const tabs: { key: TabType; label: string; glyph: LucideIcon }[] = [
    { key:"all",          label:"All",           glyph:LayoutGrid },
    { key:"psychologist", label:"Psychologists",  glyph:G.person },
    { key:"community",    label:"Group",          glyph:G.group },
    { key:"support",      label:"Support",        glyph:G.support },
    { key:"hotline",      label:"Hotlines",       glyph:G.sos },
  ];

  const C = { bg:"#121416", surface:"#161820", border:"rgba(188,194,255,0.06)", text:"#e8eaff", muted:"rgba(188,194,255,0.4)", accent:"#bcc2ff" };
  const isNearMode = sortBy === "distance" && !!userLocation;
  const allProviders = [...DB_PSY, ...DB_COMM, ...DB_SUP];

  return (
    <div style={{ background:C.bg, height:"100%", display:"flex", flexDirection:"column", fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", overflow:"hidden" }}>

      {sosOpen && <SOSModal onClose={()=>setSosOpen(false)} />}
      {savedOpen && (
        <SavedScreen
          savedIds={saved}
          allProviders={allProviders}
          onClose={() => setSavedOpen(false)}
          onDetail={openDetail}
          onFocus={setFocusProvider}
          getDistance={getDistance}
        />
      )}
      {detailProvider && (
        <DetailScreen
          e={detailProvider}
          onClose={() => setDetailProvider(null)}
          distKm={getDistance(detailProvider)}
          userLocation={userLocation}
          onFlyTo={(lat, lng) => {
            setDetailProvider(prev => prev ? { ...prev, lat, lng } : prev);
            setFocusProvider(prev => prev ? { ...prev, lat, lng } : prev);
          }}
        />
      )}

      {/* ── Sticky top ── */}
      <div style={{ flexShrink:0, background:C.bg }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "calc(env(safe-area-inset-top, 0px) + 10px) 16px 12px",
            background: "rgba(16,18,24,0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(188,194,255,0.06)",
          }}
        >
          <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              style={{
                width: 34, height: 34, flexShrink: 0,
                borderRadius: 999,
                background: "transparent",
                border: "none",
                color: "rgba(188,194,255,0.6)",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#eef1f6";
                e.currentTarget.style.background = "rgba(188,194,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(188,194,255,0.6)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ minWidth: 0, paddingLeft: 4 }}>
              <h1
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                  color: "#eef1f6",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Find Help
              </h1>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.2,
                  color: "rgba(188,194,255,0.45)",
                  margin: "3px 0 0",
                }}
              >
                Resources nearby
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleNearMe}
              disabled={locating}
              aria-pressed={isNearMode}
              aria-label={isNearMode ? "Showing nearest first — tap to clear" : "Sort by distance from you"}
              title={isNearMode ? "Showing nearest first — tap to clear" : "Sort by distance from you"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 32,
                padding: "0 12px",
                borderRadius: 999,
                background: isNearMode ? "rgba(74,158,255,0.12)" : "rgba(188,194,255,0.04)",
                border: `1px solid ${isNearMode ? "rgba(74,158,255,0.35)" : "rgba(188,194,255,0.10)"}`,
                color: isNearMode ? "#4a9eff" : "rgba(188,194,255,0.65)",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <G.nearMe size={14} />
              {locating ? "Locating…" : isNearMode ? "Nearest" : "Near"}
            </button>
            {saved.size > 0 && (
              <button
                type="button"
                onClick={() => setSavedOpen(true)}
                aria-label="Saved resources"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  borderRadius: 999,
                  background: "rgba(188,194,255,0.08)",
                  border: "1px solid rgba(188,194,255,0.15)",
                  color: "#bcc2ff",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  transition: "all 0.15s",
                }}
              >
                <G.bookmark size={14} fill="currentColor" />
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "#bcc2ff", color: "#121416", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{saved.size}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSosOpen(true)}
              aria-label="Emergency hotlines"
              title="Emergency hotlines"
              style={{
                width: 32, height: 32, flexShrink: 0,
                borderRadius: 999,
                background: "rgba(224,92,110,0.10)",
                border: "1px solid rgba(224,92,110,0.30)",
                color: "#e05c6e",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <G.sos size={14} />
            </button>
          </div>
        </header>

        <div style={{ padding: "12px 16px 0" }}>

          {/* Search + city */}
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <div style={{ flex:1, background:C.surface, borderRadius:12, display:"flex", alignItems:"center", gap:8, padding:"0 12px", height:42, border:`1px solid ${C.border}` }}>
              <G.search size={14} color={search ? C.accent : C.muted} style={{ transition:"color 0.2s" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search resources…"
                style={{ border:"none", outline:"none", fontFamily:"inherit", fontSize:13, color:C.text, background:"transparent", flex:1, padding:"0", minWidth:0 }} />
              {search && <button onClick={()=>setSearch("")} aria-label="Clear search" style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, padding:0, display:"inline-flex", alignItems:"center" }}><G.close size={14} /></button>}
            </div>
            <select value={city} onChange={e=>setCity(e.target.value)} aria-label="Filter by city"
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, color:city?C.text:C.muted, fontFamily:"inherit", fontSize:12, padding:"0 28px 0 12px", height:42, cursor:"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' fill='none' stroke='%23bcc2ff' stroke-opacity='0.4' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
              <option value="">All cities</option>
              {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:14, scrollbarWidth:"none" }}>
            {tabs.map(t => {
              const TabIcon = t.glyph;
              return (
                <button key={t.key} onClick={()=>{setTab(t.key);setFocusProvider(null);}}
                  style={{ padding:"7px 13px", borderRadius:999, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:6, background:tab===t.key?C.accent:C.surface, color:tab===t.key?"#121416":C.muted, transition:"all 0.15s", boxShadow:tab===t.key?"0 10px 24px -16px rgba(188,194,255,0.6)":"none" }}>
                  <TabIcon size={12} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map */}
        {tab !== "hotline" && (
          mapCollapsed ? (
            <button onClick={()=>setMapCollapsed(false)} style={{ width:"100%", background:C.surface, border:"none", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"10px 16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"inherit" }}>
              <span style={{ fontSize:12, color:C.muted, fontWeight:500, display:"inline-flex", alignItems:"center", gap:6 }}><G.map size={14} /> Show map ({mapProviders.filter(p=>p.lat).length} pins)</span>
              <span style={{ fontSize:11, color:C.accent, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 }}><G.expand size={12} /> Expand</span>
            </button>
          ) : (
            <LiveMap providers={mapProviders} focusProvider={focusProvider} userLocation={userLocation} mapLayer={mapLayer} onLayerChange={setMapLayer} onCollapse={()=>setMapCollapsed(true)} onResetFocus={focusProvider ? ()=>setFocusProvider(null) : null} />
          )
        )}

        {tab === "hotline" && (
          <div style={{ margin:"0 16px 10px", padding:"14px 16px", background:"linear-gradient(160deg, rgba(255,123,123,0.10), rgba(255,185,84,0.05))", borderRadius:16, border:"1px solid rgba(255,123,123,0.22)" }}>
            <p style={{ fontSize:11, fontWeight:500, letterSpacing:"1.1px", textTransform:"uppercase", color:"rgba(255,170,170,0.78)", marginBottom:6, display:"inline-flex", alignItems:"center", gap:6 }}>
              <G.sos size={12} /> In immediate danger?
            </p>
            <p className="font-serif" style={{ fontSize:14, color:"#f7e4e4", lineHeight:1.5, margin:0 }}>
              If you're in crisis, tap any number below. These lines are free and confidential.
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable list ── */}
      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch" } as React.CSSProperties}>

        <RecentlyViewed ids={recentIds} allProviders={allProviders} onSelect={(p) => { openDetail(p); setFocusProvider(p); }} />

        {(tab==="all"||tab==="hotline") && (
          <div>
            {tab==="all" && <SectionHeader label="Emergency Hotlines" count={DB_HOT.length} color="#e05c6e" />}
            {DB_HOT.map(h=><HotlineCard key={h.id} h={h}/>)}
          </div>
        )}

        {(tab==="all"||tab==="psychologist") && filtered.psy.length > 0 && (
          <div>
            <SectionHeader label="Psychologists" count={filtered.psy.length} color={C.accent} />
            {filtered.psy.map(e=><ProviderCard key={e.id} e={e} saved={saved.has(e.id)} onSave={toggleSave} onFocus={setFocusProvider} onDetail={openDetail} isFocused={focusProvider?.id===e.id} distKm={getDistance(e)}/>)}
          </div>
        )}

        {(tab==="all"||tab==="community") && filtered.comm.length > 0 && (
          <div>
            <SectionHeader label="Community & Group" count={filtered.comm.length} color="#6dba84" />
            {filtered.comm.map(e=><ProviderCard key={e.id} e={e} saved={saved.has(e.id)} onSave={toggleSave} onFocus={setFocusProvider} onDetail={openDetail} isFocused={focusProvider?.id===e.id} distKm={getDistance(e)}/>)}
          </div>
        )}

        {(tab==="all"||tab==="support") && filtered.sup.length > 0 && (
          <div>
            <SectionHeader label="Support Connections" count={filtered.sup.length} color="#e0853c" />
            {filtered.sup.map(e=><ProviderCard key={e.id} e={e} saved={saved.has(e.id)} onSave={toggleSave} onFocus={setFocusProvider} onDetail={openDetail} isFocused={focusProvider?.id===e.id} distKm={getDistance(e)}/>)}
          </div>
        )}

        {filtered.psy.length===0 && filtered.comm.length===0 && filtered.sup.length===0 && tab!=="hotline" && (
          <div style={{ margin:"16px", padding:"28px 20px", textAlign:"center", color:C.muted, fontSize:13, borderRadius:16, background:"rgba(188,194,255,0.03)", border:"1px dashed rgba(188,194,255,0.10)" }}>
            <G.search size={26} color={C.muted} style={{ marginBottom:8, opacity:0.5 }} />
            <p className="font-serif" style={{ fontSize:14, color:"rgba(188,194,255,0.65)", margin:0, lineHeight:1.5 }}>
              No resources match your search.
            </p>
            <p style={{ fontSize:11, color:"rgba(220,224,255,0.7)", margin:"6px 0 0" }}>
              Try a different keyword or city.
            </p>
          </div>
        )}
        <div style={{ height:24 }} />
      </div>
    </div>
  );
}