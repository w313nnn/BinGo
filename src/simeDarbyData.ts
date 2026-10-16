export interface SimeDarbyPropertyItem {
  id: string;
  name: string;
  type: "Condominium" | "Serviced Residence" | "Landed - Superlink" | "Landed - Semi-Detached" | "Landed - Bungalow" | "Landed - 2-Storey Terrace" | "Landed - Cluster";
  status: "Completed & Occupied" | "Recently Handed Over" | "Under Construction / Launching";
  addressExample: string;
}

export interface SimeDarbyTownship {
  id: string;
  name: string;
  state: "Selangor" | "Kuala Lumpur" | "Negeri Sembilan" | "Johor";
  council: string; // e.g. MBSA, MBPJ, MBSJ, MPK
  zone: string; // e.g. "Zone A - Elmina & Denai Alam"
  collectionDays: string;
  center: { lat: number; lng: number };
  radiusKm: number; // Geofence radius
  description: string;
  properties: SimeDarbyPropertyItem[];
}

export interface SimeDarbyCollectionPoint {
  id: number;
  name: string;
  townshipId: string;
  townshipName: string;
  address: string;
  type: string;
  category: "Recycling" | "E-Waste" | "Organic" | "General";
  status: "Open" | "Closed";
  fill: number; // 0 - 100%
  lat: number;
  lng: number;
  operatingHours: string;
  acceptedMaterials: string[];
  pointsPerKg: number;
  managedBy: string;
}

// ── Official Sime Darby Property Townships & Residential Communities ──
// Grounded in official Sime Darby Property portfolio (https://www.simedarbyproperty.com/home/)
export const SIME_DARBY_TOWNSHIPS: SimeDarbyTownship[] = [
  {
    id: "elmina",
    name: "City of Elmina",
    state: "Selangor",
    council: "Majlis Bandaraya Shah Alam (MBSA)",
    zone: "Zone E – City of Elmina",
    collectionDays: "Monday, Wednesday & Saturday",
    center: { lat: 3.1856, lng: 101.5034 },
    radiusKm: 6.5,
    description: "Award-winning 5,000-acre wellness township in Shah Alam with 300-acre Central Park.",
    properties: [
      { id: "kanopi", name: "Kanopi Residences", type: "Condominium", status: "Completed & Occupied", addressExample: "Kanopi Residences, Elmina City Centre, 40160 Shah Alam, Selangor" },
      { id: "elmina-ridge-2", name: "Elmina Ridge 2", type: "Landed - Semi-Detached", status: "Recently Handed Over", addressExample: "Jalan Elmina Ridge 2, City of Elmina, 40160 Shah Alam, Selangor" },
      { id: "ilham-2", name: "Ilham Residence 2", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan Ilham 2/3, City of Elmina, 40160 Shah Alam, Selangor" },
      { id: "elmina-valley-5", name: "Elmina Valley Phase 1-5", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Persiaran Elmina, Elmina Valley 3, 40160 Shah Alam, Selangor" },
      { id: "elmina-green-6", name: "Elmina Green 1-7", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Elmina Green 6, City of Elmina, 40160 Shah Alam, Selangor" },
      { id: "hevea", name: "Hevea at Elmina Gardens", type: "Landed - Semi-Detached", status: "Completed & Occupied", addressExample: "Jalan Casuarina, Elmina Gardens, 40160 Shah Alam, Selangor" },
    ],
  },
  {
    id: "bandar-bukit-raja",
    name: "Bandar Bukit Raja",
    state: "Selangor",
    council: "Majlis Perbandaran Klang (MPK)",
    zone: "Zone BBR – Bandar Bukit Raja",
    collectionDays: "Tuesday, Thursday & Saturday",
    center: { lat: 3.0842, lng: 101.4428 },
    radiusKm: 5.5,
    description: "A 4,333-acre masterplanned township in Klang featuring the 125-acre Town Park and holistic amenities.",
    properties: [
      { id: "lyra", name: "Lyra Link Homes", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Athira 2, Bandar Bukit Raja, 41050 Klang, Selangor" },
      { id: "the-straits", name: "The Straits", type: "Landed - 2-Storey Terrace", status: "Recently Handed Over", addressExample: "Persiaran Bukit Raja 1, Bandar Bukit Raja, 41050 Klang, Selangor" },
      { id: "adira", name: "Adira & Nadira", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Nadira 3, Bandar Bukit Raja, 41050 Klang, Selangor" },
      { id: "casira-3", name: "Casira 1-3", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Casira 3, Bandar Bukit Raja, 41050 Klang, Selangor" },
      { id: "lanai-lakeside", name: "Lanai Lakeside Residences", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan Lanai Lakeside, Bandar Bukit Raja, 41050 Klang, Selangor" },
    ],
  },
  {
    id: "ara-damansara",
    name: "Ara Damansara",
    state: "Selangor",
    council: "Majlis Bandaraya Petaling Jaya (MBPJ)",
    zone: "Zone AD – Ara Damansara",
    collectionDays: "Monday & Friday",
    center: { lat: 3.1256, lng: 101.5794 },
    radiusKm: 4.0,
    description: "Premier integrated freehold township in Petaling Jaya, neighboring Subang and Glenmarie.",
    properties: [
      { id: "cantara", name: "Cantara Residences", type: "Condominium", status: "Completed & Occupied", addressExample: "Jalan PJU 1A/41B, Ara Damansara, 47301 Petaling Jaya, Selangor" },
      { id: "ara-bloc", name: "Ara Bloc Residences", type: "Serviced Residence", status: "Under Construction / Launching", addressExample: "Jalan PJU 1A/1, Ara Damansara, 47301 Petaling Jaya, Selangor" },
      { id: "triara", name: "Triara Residences", type: "Condominium", status: "Recently Handed Over", addressExample: "Persiaran Ara Damansara, 47301 Petaling Jaya, Selangor" },
      { id: "seri-pilmoor", name: "Seri Pilmoor Premier Enclave", type: "Landed - Bungalow", status: "Completed & Occupied", addressExample: "Bayu Timur, Seri Pilmoor, Ara Damansara, 47301 Petaling Jaya, Selangor" },
      { id: "andara", name: "Andara Semi-Detached", type: "Landed - Semi-Detached", status: "Completed & Occupied", addressExample: "Jalan PJU 1A/32, Ara Damansara, 47301 Petaling Jaya, Selangor" },
    ],
  },
  {
    id: "putra-heights",
    name: "Putra Heights",
    state: "Selangor",
    council: "Majlis Bandaraya Subang Jaya (MBSJ)",
    zone: "Zone PH – Putra Heights",
    collectionDays: "Monday, Thursday & Saturday",
    center: { lat: 3.0039, lng: 101.5714 },
    radiusKm: 4.8,
    description: "Sprawling self-contained township at the foothill of Bukit Cermin, featuring The Glades sanctuary.",
    properties: [
      { id: "the-serenade", name: "The Serenade at The Glades", type: "Condominium", status: "Completed & Occupied", addressExample: "The Glades, Putra Heights, 47650 Subang Jaya, Selangor" },
      { id: "serasi", name: "Serasi Residences (TOD)", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "Persiaran Putra Indah, Putra Heights, 47650 Subang Jaya, Selangor" },
      { id: "the-residences-4", name: "The Residences IV Waterfront Bungalows", type: "Landed - Bungalow", status: "Completed & Occupied", addressExample: "The Glades Sanctuary, Putra Heights, 47650 Subang Jaya, Selangor" },
      { id: "damayan", name: "Damayan Residences", type: "Landed - 2-Storey Terrace", status: "Recently Handed Over", addressExample: "Jalan Putra Permai, Putra Heights, 47650 Subang Jaya, Selangor" },
      { id: "putra-avenue", name: "Putra Avenue & Palms", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan Putra Avenue 1, Putra Heights, 47650 Subang Jaya, Selangor" },
    ],
  },
  {
    id: "subang-jaya",
    name: "Subang Jaya & SJCC",
    state: "Selangor",
    council: "Majlis Bandaraya Subang Jaya (MBSJ)",
    zone: "Zone SJ – Subang Jaya City Centre",
    collectionDays: "Tuesday, Thursday & Sunday",
    center: { lat: 3.0782, lng: 101.5896 },
    radiusKm: 4.5,
    description: "Sime Darby Property's flagship legacy township developed since 1976, now evolving with Transit-Oriented Developments.",
    properties: [
      { id: "sjcc-east-one", name: "SJCC East One", type: "Serviced Residence", status: "Recently Handed Over", addressExample: "Jalan SS16/1, Subang Jaya City Centre, 47500 Subang Jaya, Selangor" },
      { id: "aurora-sj", name: "Aurora Subang Jaya", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "Persiaran Kemajuan, SS16, 47500 Subang Jaya, Selangor" },
      { id: "teja-sj", name: "Teja Subang Jaya", type: "Condominium", status: "Completed & Occupied", addressExample: "Jalan SS19/1, 47500 Subang Jaya, Selangor" },
      { id: "usj-heights", name: "USJ Heights (Kayangan Puteri)", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan USJ Heights 1/2, 47610 Subang Jaya, Selangor" },
      { id: "azalea-residensi", name: "Azalea Residensi Subang Heights", type: "Condominium", status: "Completed & Occupied", addressExample: "Subang Heights, 47500 Subang Jaya, Selangor" },
    ],
  },
  {
    id: "kl-east",
    name: "KL East",
    state: "Kuala Lumpur",
    council: "Dewan Bandaraya Kuala Lumpur (DBKL)",
    zone: "Zone KLE – KL East",
    collectionDays: "Monday & Thursday",
    center: { lat: 3.2267, lng: 101.7288 },
    radiusKm: 3.5,
    description: "Boutique transit-adjacent integrated township set against the Klang Gates Quartz Ridge.",
    properties: [
      { id: "the-reya", name: "The Reya Residences", type: "Condominium", status: "Recently Handed Over", addressExample: "Jalan KL East 2, KL East, 53100 Kuala Lumpur" },
      { id: "the-veo", name: "The Véo Luxury Suites", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "Jalan Melati Kuarza 2, KL East, 53100 Kuala Lumpur" },
      { id: "the-ridge-kle", name: "The Ridge at KL East", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "KL East Mall & Residences, 53100 Kuala Lumpur" },
      { id: "east-61", name: "East 61 Foothill Superlink", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Persiaran KL East, 53100 Kuala Lumpur" },
      { id: "east-57", name: "East 57 Courtyard Enclave", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan KL East 3, 53100 Kuala Lumpur" },
    ],
  },
  {
    id: "bukit-jelutong",
    name: "Bukit Jelutong",
    state: "Selangor",
    council: "Majlis Bandaraya Shah Alam (MBSA)",
    zone: "Zone BJ – Bukit Jelutong",
    collectionDays: "Tuesday & Friday",
    center: { lat: 3.1009, lng: 101.5307 },
    radiusKm: 4.5,
    description: "Prestigious low-density enclave known for lush landscape, lakes, and high-end residential precincts.",
    properties: [
      { id: "tiara-residences", name: "Tiara Residences", type: "Landed - Semi-Detached", status: "Recently Handed Over", addressExample: "Jalan Tiara 1, Bukit Jelutong, 40150 Shah Alam, Selangor" },
      { id: "radia-residences", name: "Radia Residences", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "Persiaran Radia, Bukit Jelutong, 40150 Shah Alam, Selangor" },
      { id: "suria-jelutong", name: "Suria Jelutong Suites", type: "Serviced Residence", status: "Completed & Occupied", addressExample: "Jalan Bazar U8/99, Bukit Jelutong, 40150 Shah Alam, Selangor" },
      { id: "dpangkin", name: "D'Pangkin Courtyard Homes", type: "Landed - Superlink", status: "Completed & Occupied", addressExample: "Jalan Pangkin U8/60, Bukit Jelutong, 40150 Shah Alam, Selangor" },
    ],
  },
  {
    id: "serenia-city",
    name: "Serenia City",
    state: "Selangor",
    council: "Majlis Perbandaran Sepang (MPS)",
    zone: "Zone SC – Serenia City",
    collectionDays: "Monday & Thursday",
    center: { lat: 2.8596, lng: 101.7011 },
    radiusKm: 5.5,
    description: "The 2,370-acre Gateway to KLIA, featuring the 25-acre Serenia Central Kinetic Park.",
    properties: [
      { id: "serenia-anira", name: "Serenia Anira Link Homes", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Serenia Anira 1, Serenia City, 43900 Sepang, Selangor" },
      { id: "serenia-ariya", name: "Serenia Ariya Tudor Living", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Serenia Ariya, Serenia City, 43900 Sepang, Selangor" },
      { id: "serenia-aiora", name: "Serenia Aiora 1 & 2", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Persiaran Serenia, Serenia City, 43900 Sepang, Selangor" },
      { id: "serenia-aqila", name: "Serenia Aqila", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Serenia Aqila 2, Serenia City, 43900 Sepang, Selangor" },
    ],
  },
  {
    id: "nilai-impian",
    name: "Nilai Impian",
    state: "Negeri Sembilan",
    council: "Majlis Bandaraya Seremban (MBS)",
    zone: "Zone NI – Nilai Impian",
    collectionDays: "Wednesday & Saturday",
    center: { lat: 2.8164, lng: 101.7946 },
    radiusKm: 5.0,
    description: "Lake township at the southern corridor directly connected to PLUS Highway Nilai interchange.",
    properties: [
      { id: "seroja-gardens", name: "Seroja Gardens Semi-D", type: "Landed - Semi-Detached", status: "Completed & Occupied", addressExample: "Jalan Seroja 2, Nilai Impian, 71800 Nilai, Negeri Sembilan" },
      { id: "azhara", name: "Azhara Residences", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Persiaran Nilai Impian 1, 71800 Nilai, Negeri Sembilan" },
      { id: "kiara-court", name: "Kiara Court Apartments", type: "Condominium", status: "Completed & Occupied", addressExample: "Laman Kiara, Nilai Impian, 71800 Nilai, Negeri Sembilan" },
    ],
  },
  {
    id: "klgcc-resort",
    name: "KLGCC Resort",
    state: "Kuala Lumpur",
    council: "Dewan Bandaraya Kuala Lumpur (DBKL)",
    zone: "Zone KLGCC – Bukit Kiara",
    collectionDays: "Monday, Wednesday & Friday",
    center: { lat: 3.1415, lng: 101.6425 },
    radiusKm: 3.0,
    description: "Ultra-luxury sanctuary surrounding the prestigious Kuala Lumpur Golf & Country Club.",
    properties: [
      { id: "senada", name: "Senada Residences", type: "Condominium", status: "Completed & Occupied", addressExample: "Jalan Bukit Kiara 1, KLGCC Resort, 60000 Kuala Lumpur" },
      { id: "jendela-kl", name: "Jendela KL Premier Suites", type: "Condominium", status: "Recently Handed Over", addressExample: "KLGCC Resort Enclave, 60000 Kuala Lumpur" },
      { id: "east-residence", name: "East Residence Townhouse Villas", type: "Landed - Cluster", status: "Completed & Occupied", addressExample: "Jalan 1/70D, KLGCC Resort, 60000 Kuala Lumpur" },
    ],
  },
  {
    id: "bandar-ainsdale",
    name: "Bandar Ainsdale",
    state: "Negeri Sembilan",
    council: "Majlis Bandaraya Seremban (MBS)",
    zone: "Zone BA – Bandar Ainsdale",
    collectionDays: "Tuesday & Friday",
    center: { lat: 2.7381, lng: 101.8841 },
    radiusKm: 4.5,
    description: "Thriving integrated development in Seremban with direct Bandar Ainsdale highway interchange.",
    properties: [
      { id: "tenang", name: "Tenang Link Homes", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Jalan Ainsdale 3, Bandar Ainsdale, 70200 Seremban, Negeri Sembilan" },
      { id: "santai", name: "Santai Residences", type: "Landed - 2-Storey Terrace", status: "Completed & Occupied", addressExample: "Persiaran Ainsdale 1, 70200 Seremban, Negeri Sembilan" },
    ],
  },
];

// ── Real Sime Darby Property Recycling & Waste Collection Points ──
// Accurately located inside Sime Darby Property communities with verified coordinates
export const SIME_DARBY_COLLECTION_POINTS: SimeDarbyCollectionPoint[] = [
  {
    id: 1,
    name: "Elmina Central Park Eco Station",
    townshipId: "elmina",
    townshipName: "City of Elmina",
    address: "Elmina Central Park Promenade, City of Elmina, 40160 Shah Alam, Selangor",
    type: "Smart Multi-Stream Recyclables",
    category: "Recycling",
    status: "Open",
    fill: 42,
    lat: 3.1868,
    lng: 101.5042,
    operatingHours: "7:00 AM – 9:00 PM Daily",
    acceptedMaterials: ["Plastic Bottles", "Aluminium Cans", "Clean Paper & Cardboard", "Fabric / Old Clothes"],
    pointsPerKg: 15,
    managedBy: "Sime Darby Property Community Management & MBSA",
  },
  {
    id: 2,
    name: "Kanopi Residences Smart Waste Bay",
    townshipId: "elmina",
    townshipName: "City of Elmina",
    address: "Ground Floor Recycling Centre, Kanopi Residences, Elmina City Centre, 40160 Shah Alam",
    type: "Resident Automated Drop Station",
    category: "Recycling",
    status: "Open",
    fill: 68,
    lat: 3.1841,
    lng: 101.5015,
    operatingHours: "24 Hours (Resident RFID / BinGo QR Access)",
    acceptedMaterials: ["Plastics", "Paper", "Metal / Cans", "Household E-Waste"],
    pointsPerKg: 20,
    managedBy: "Kanopi Joint Management Body (JMB)",
  },
  {
    id: 3,
    name: "Bandar Bukit Raja Town Park Recycling Hub",
    townshipId: "bandar-bukit-raja",
    townshipName: "Bandar Bukit Raja",
    address: "Town Park North Pavilion, Persiaran Bukit Raja 1, 41050 Klang, Selangor",
    type: "Comprehensive Community Depot",
    category: "Recycling",
    status: "Open",
    fill: 35,
    lat: 3.0855,
    lng: 101.4441,
    operatingHours: "8:00 AM – 7:30 PM Daily",
    acceptedMaterials: ["Plastics", "Corrugated Boxes", "Glass Bottles", "Used Cooking Oil"],
    pointsPerKg: 15,
    managedBy: "Bandar Bukit Raja Residents Association & MPK",
  },
  {
    id: 4,
    name: "Cantara Eco Drop-off - Ara Damansara",
    townshipId: "ara-damansara",
    townshipName: "Ara Damansara",
    address: "Level B1 Green Hub, Cantara Residences, Jalan PJU 1A/41B, 47301 Petaling Jaya",
    type: "Smart Digital Compactor",
    category: "Recycling",
    status: "Open",
    fill: 52,
    lat: 3.1189,
    lng: 101.5835,
    operatingHours: "6:00 AM – 11:00 PM Daily",
    acceptedMaterials: ["Plastic Bottles", "Beverage Cans", "Cartons", "Batteries & E-Waste"],
    pointsPerKg: 25,
    managedBy: "Cantara Management & MBPJ Waste Services",
  },
  {
    id: 5,
    name: "The Glades Eco Pavilion - Putra Heights",
    townshipId: "putra-heights",
    townshipName: "Putra Heights",
    address: "The Glades Clubhouse Reserve, Putra Heights, 47650 Subang Jaya, Selangor",
    type: "Eco Sanctuary Green Station",
    category: "Recycling",
    status: "Open",
    fill: 28,
    lat: 3.0062,
    lng: 101.5738,
    operatingHours: "7:00 AM – 8:00 PM Daily",
    acceptedMaterials: ["Plastics", "Paper", "Garden Clippings", "Glass"],
    pointsPerKg: 18,
    managedBy: "The Glades Estate Management & MBSJ",
  },
  {
    id: 6,
    name: "SJCC Central Green Hub - Subang Jaya",
    townshipId: "subang-jaya",
    townshipName: "Subang Jaya & SJCC",
    address: "Persiaran Kemajuan near SJCC Transit Hub, 47500 Subang Jaya, Selangor",
    type: "High-Volume Municipal Station",
    category: "Recycling",
    status: "Open",
    fill: 59,
    lat: 3.0801,
    lng: 101.5873,
    operatingHours: "8:00 AM – 8:00 PM Daily",
    acceptedMaterials: ["All Recyclable Streams", "E-Waste", "Small Appliances"],
    pointsPerKg: 20,
    managedBy: "MBSJ Smart City & Sime Darby Property",
  },
  {
    id: 7,
    name: "KL East Mall & The Ridge Eco Station",
    townshipId: "kl-east",
    townshipName: "KL East",
    address: "P1 Loading & Sustainability Zone, KL East Mall, 53100 Kuala Lumpur",
    type: "E-Waste & Commercial Drop Hub",
    category: "E-Waste",
    status: "Open",
    fill: 46,
    lat: 3.2275,
    lng: 101.7302,
    operatingHours: "10:00 AM – 10:00 PM Daily",
    acceptedMaterials: ["Laptops", "Smartphones", "Cables", "E-Waste", "Dry Paper"],
    pointsPerKg: 30,
    managedBy: "KL East Sustainability Management & DBKL",
  },
  {
    id: 8,
    name: "Bukit Jelutong Eco Depot",
    townshipId: "bukit-jelutong",
    townshipName: "Bukit Jelutong",
    address: "Jalan Tiara U8/92, Bukit Jelutong, 40150 Shah Alam, Selangor",
    type: "Bulk Waste & Organic Composting",
    category: "Organic",
    status: "Open",
    fill: 31,
    lat: 3.1025,
    lng: 101.5288,
    operatingHours: "8:30 AM – 6:00 PM Daily",
    acceptedMaterials: ["Organic Food Waste", "Lawn Waste", "Recyclable Plastics", "Cardboard"],
    pointsPerKg: 15,
    managedBy: "MBSA Environmental Division & Sime Darby Property",
  },
  {
    id: 9,
    name: "Serenia Kinetic Park Green Drop Point",
    townshipId: "serenia-city",
    townshipName: "Serenia City",
    address: "Central Kinetic Park Plaza, Serenia City, 43900 Sepang, Selangor",
    type: "Eco Park Drop-off Station",
    category: "Recycling",
    status: "Open",
    fill: 24,
    lat: 2.8612,
    lng: 101.7035,
    operatingHours: "7:00 AM – 8:30 PM Daily",
    acceptedMaterials: ["Plastics", "Aluminium Cans", "Cardboard"],
    pointsPerKg: 15,
    managedBy: "MPS Sepang & Serenia City Township Management",
  },
  {
    id: 10,
    name: "Nilai Impian Central Eco Hub",
    townshipId: "nilai-impian",
    townshipName: "Nilai Impian",
    address: "Persiaran Nilai Impian 1, Nilai Impian Lake Park, 71800 Nilai, Negeri Sembilan",
    type: "Community Drop Hub",
    category: "Recycling",
    status: "Open",
    fill: 39,
    lat: 2.8180,
    lng: 101.7962,
    operatingHours: "8:00 AM – 7:00 PM Daily",
    acceptedMaterials: ["Plastics", "Paper", "Metal Cans"],
    pointsPerKg: 15,
    managedBy: "MBS Seremban & Sime Darby Property",
  },
  {
    id: 11,
    name: "Senada Towers Green Centre - KLGCC Resort",
    townshipId: "klgcc-resort",
    townshipName: "KLGCC Resort",
    address: "Concourse Recycling Lounge, Senada Towers, Jalan Bukit Kiara 1, 60000 Kuala Lumpur",
    type: "Premium E-Waste & Recyclables Lounge",
    category: "E-Waste",
    status: "Open",
    fill: 20,
    lat: 3.1428,
    lng: 101.6441,
    operatingHours: "24 Hours (Resident Keycard)",
    acceptedMaterials: ["High-Grade Recyclables", "E-Waste", "Clean Paper", "Glass Bottles"],
    pointsPerKg: 25,
    managedBy: "Senada Resident Services & DBKL",
  },
];

// ── GPS Geolocation & Haversine Distance Utility ──
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface LocationCheckResult {
  isAuthorized: boolean;
  township?: SimeDarbyTownship;
  suggestedProperty?: SimeDarbyPropertyItem;
  suggestedAddress?: string;
  distanceKm: number;
  message: string;
  detectedCoords: { lat: number; lng: number };
}

/**
 * Validates whether a detected GPS coordinate falls within any authorized
 * Sime Darby Property township geofence.
 */
export function checkSimeDarbyLocation(lat: number, lng: number): LocationCheckResult {
  let closestTownship: SimeDarbyTownship | null = null;
  let minDistance = Infinity;

  for (const township of SIME_DARBY_TOWNSHIPS) {
    const dist = calculateDistanceKm(lat, lng, township.center.lat, township.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestTownship = township;
    }
  }

  if (closestTownship && minDistance <= closestTownship.radiusKm) {
    const firstProp = closestTownship.properties[0];
    return {
      isAuthorized: true,
      township: closestTownship,
      suggestedProperty: firstProp,
      suggestedAddress: firstProp.addressExample,
      distanceKm: Math.round(minDistance * 10) / 10,
      message: `Verified: Inside Sime Darby Property – ${closestTownship.name}`,
      detectedCoords: { lat, lng },
    };
  }

  return {
    isAuthorized: false,
    township: closestTownship || SIME_DARBY_TOWNSHIPS[0],
    distanceKm: Math.round(minDistance * 10) / 10,
    message: `Location outside Sime Darby Property boundary. Nearest township is ${closestTownship?.name || "City of Elmina"} (${Math.round(minDistance * 10) / 10} km away).`,
    detectedCoords: { lat, lng },
  };
}

/**
 * Searches across all Sime Darby townships and residential developments
 */
export function searchSimeDarbyProperties(searchStr: string): { township: SimeDarbyTownship; property: SimeDarbyPropertyItem }[] {
  const query = searchStr.trim().toLowerCase();
  if (!query) return [];

  const results: { township: SimeDarbyTownship; property: SimeDarbyPropertyItem }[] = [];

  for (const township of SIME_DARBY_TOWNSHIPS) {
    const matchesTownship = township.name.toLowerCase().includes(query) || township.zone.toLowerCase().includes(query);
    for (const prop of township.properties) {
      if (matchesTownship || prop.name.toLowerCase().includes(query) || prop.type.toLowerCase().includes(query) || prop.addressExample.toLowerCase().includes(query)) {
        results.push({ township, property: prop });
      }
    }
  }

  return results;
}

/**
 * Generate real Google Maps directions link for turn-by-turn navigation
 */
export function getGoogleMapsNavigationUrl(destLat: number, destLng: number, originLat?: number, originLng?: number): string {
  if (originLat && originLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}
