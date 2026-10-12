import { FileText, Shield, Zap, Wrench, Car, Factory, Coffee, Tv, Scissors, Wine, Hotel, Anchor, Utensils, ShoppingBag, Store, Users, Truck, Music, Pill, Briefcase, Flame } from "lucide-react";

export type ChecklistItem = {
  id: string;
  label: string;
  responsible:
    | "Applicant"
    | "Council"
    | "PACRA"
    | "ZRA"
    | "ZEMA"
    | "ZAMRA"
    | "Landlord"
    | "Public Health Dept"
    | "Ministry of Labour"
    | "Zambia Police Service"
    | "ERB"
    | "RTSA"
    | "ZICTA"
    | "ZABS"
    | "ZTA"
    | "Fire & Rescue Services"
    | "City Planning Dept"
    | "Commercial Water Utility"
    | "Commissioner for Oaths"
    | "NCDC"
    | "IPA"
    | "Department of Health"
    | "Labour Department"
    | "Justice of Peace"
    | "Traffic Police"
    | "IRC/Customs"
    | "Maritime Authority"
    | "NDoH-Pharmacy Board";
  required: boolean;
  note?: string;
};

export type LicenseType = {
  id: string;
  name: string;
  category: "Trading" | "Liquor" | "Industrial" | "Health" | "Transport" | "General" | "Services";
  icon: any;
  formType: string;
  checklist: ChecklistItem[];
};

export const COMMON_REQUIREMENTS: ChecklistItem[] = [
  { id: "pacra_cert", label: "PACRA Certificate of Incorporation / Business Name Registration", responsible: "PACRA", required: true, note: "Valid PACRA Registration" },
  { id: "pacra_extract", label: "PACRA Company Profile / Computer Printout", responsible: "PACRA", required: true, note: "Showing active directors & shareholders" },
  { id: "zra_tpin", label: "ZRA Taxpayer Identification Number (TPIN) Certificate", responsible: "ZRA", required: true, note: "Valid ZRA TPIN" },
  { id: "zra_tcc", label: "ZRA Tax Clearance Certificate (TCC)", responsible: "ZRA", required: true, note: "Current fiscal year clearance" },
  { id: "land_title", label: "Title Deed / Valid Commercial Lease Agreement", responsible: "Landlord", required: true, note: "Proof of lawful occupancy" },
  { id: "planning_clearance", label: "City Planning & Zoning Clearance", responsible: "City Planning Dept", required: true, note: "Compliance with Urban & Regional Planning Act 2015" },
  { id: "building_approval", label: "Building Authority & Structural Safety Approval", responsible: "Council", required: true, note: "If structural modifications exist" },
  { id: "fire_certificate", label: "Fire & Rescue Safety Certificate", responsible: "Fire & Rescue Services", required: true, note: "Fire extinguishers, emergency exits & hydrants inspection" },
  { id: "health_inspection", label: "Public Health Sanitary Inspection Certificate", responsible: "Public Health Dept", required: true, note: "Issued under Public Health Act Cap 295" },
  { id: "rates_clearance", label: "Council Property Rates & Refuse Levy Clearance", responsible: "Council", required: true, note: "Proof of municipal levy payment" },
  { id: "prev_license", label: "Copy of Previous Year Trading Permit", responsible: "Applicant", required: false, note: "Required for renewals / change of ownership" },
];

export const LIQUOR_REQUIREMENTS: ChecklistItem[] = [
  ...COMMON_REQUIREMENTS,
  { id: "notice_intention", label: "Notice of Intention to Apply for Liquor Licence", responsible: "Applicant", required: true, note: "Published in national newspaper or displayed at Council Notice Board for 14 days" },
  { id: "police_clearance", label: "Zambia Police Service Criminal Record / Fingerprint Clearance", responsible: "Zambia Police Service", required: true, note: "Clearance for all directors and nominated premise manager" },
  { id: "approved_manager", label: "Nomination Letter for Approved Premise Manager", responsible: "Applicant", required: true, note: "Certified copy of NRC and credentials" },
  { id: "statutory_declaration", label: "Statutory Declaration before Commissioner for Oaths", responsible: "Commissioner for Oaths", required: true, note: "Sworn affidavit certifying truthfulness of all submissions" },
  { id: "planning_distance", label: "City Planning Distance Clearance (> 300m from school/church)", responsible: "City Planning Dept", required: true, note: "Zoning restriction under Liquor Licensing Act No. 20 of 2011" },
  { id: "bar_schedule", label: "Schedule of Bars and Service Counters", responsible: "Applicant", required: true, note: "Detailed floor plan showing service areas" },
];

export const LICENSE_TYPES: LicenseType[] = [
  // General Trading
  {
    id: "general_trading",
    name: "General Trading License",
    category: "General",
    icon: Briefcase,
    formType: "FORM LCC/TR-01",
    checklist: COMMON_REQUIREMENTS,
  },
  {
    id: "wholesale_distribution",
    name: "Wholesale & Distribution License",
    category: "Trading",
    icon: Truck,
    formType: "FORM LCC/TR-02",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "warehouse_safety", label: "Warehouse Safety & Stacking Inspection Report", responsible: "Ministry of Labour", required: true, note: "Factories Inspectorate clearance" },
    ],
  },
  {
    id: "second_hand_clothing",
    name: "Second Hand / Used Clothing (Salaula)",
    category: "Trading",
    icon: ShoppingBag,
    formType: "FORM LCC/TR-05",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "fumigation", label: "Certificate of Fumigation & Disinfection", responsible: "Public Health Dept", required: true, note: "Port Health / Ministry of Health clearance" },
      { id: "customs_entry", label: "ZRA Customs Import Entry Declaration", responsible: "ZRA", required: true, note: "Proof of legal importation & customs duty payment" },
    ],
  },
  {
    id: "electronics_shop",
    name: "Electronics & Telecommunications Shop",
    category: "Trading",
    icon: Tv,
    formType: "FORM LCC/TR-07",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "zicta_license", label: "ZICTA Dealer & Type Approval License", responsible: "ZICTA", required: true, note: "Dealer certificate under ICT Act" },
    ],
  },
  {
    id: "motor_vehicle_dealer",
    name: "Motor Vehicle Dealership",
    category: "Trading",
    icon: Car,
    formType: "FORM LCC/TR-06",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "rtsa_dealer", label: "RTSA Motor Dealer Licence", responsible: "RTSA", required: true, note: "Road Transport and Safety Agency certification" },
      { id: "police_interpol", label: "Zambia Police Service CID / Interpol Clearance", responsible: "Zambia Police Service", required: true, note: "Motor vehicle dealership security clearance" },
      { id: "parking_clearance", label: "Customer Parking & Display Bay Approval", responsible: "City Planning Dept", required: true },
    ],
  },
  {
    id: "barber_shop",
    name: "Barber Shop & Beauty Salon",
    category: "Services",
    icon: Scissors,
    formType: "FORM LCC/SV-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "sanitation_sterilization", label: "Instrument Sterilization & Sanitation Clearance", responsible: "Public Health Dept", required: true, note: "Autoclave / UV sterilizer inspection" },
    ],
  },
  {
    id: "entertainment_place",
    name: "Place of Entertainment / Cinema / Arena",
    category: "Trading",
    icon: Music,
    formType: "FORM LCC/EN-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "acoustic_clearance", label: "Acoustic & Noise Control Assessment", responsible: "ZEMA", required: true, note: "Soundproofing and decibel limits certification" },
      { id: "crowd_safety", label: "Crowd Safety & Emergency Exits Certification", responsible: "Fire & Rescue Services", required: true, note: "Maximum occupancy capacity rating" },
    ],
  },

  // Industrial & Fuel
  {
    id: "mechanical_workshop",
    name: "Mechanical Workshop & Auto Repair",
    category: "Industrial",
    icon: Wrench,
    formType: "FORM LCC/IN-02",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "factories_act", label: "Factories Act Registration Certificate", responsible: "Ministry of Labour", required: true, note: "Occupational health and safety compliance" },
      { id: "used_oil", label: "Used Oil & Hazardous Waste Disposal Agreement", responsible: "ZEMA", required: true, note: "Licensed ZEMA hazardous waste handler" },
    ],
  },
  {
    id: "fuel_station",
    name: "Petroleum Service Station",
    category: "Industrial",
    icon: Flame,
    formType: "FORM LCC/EN-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "erb_license", label: "Energy Regulation Board (ERB) Retail License", responsible: "ERB", required: true, note: "Valid ERB retail petroleum operating licence" },
      { id: "zema_eia", label: "ZEMA Environmental Impact Assessment Decision Letter", responsible: "ZEMA", required: true, note: "Approved EIA / EPB for fuel installation" },
      { id: "tank_calibration", label: "Underground Tank Pressure & Calibration Certificate", responsible: "ERB", required: true, note: "Approved third-party inspection certificate" },
      { id: "hazmat_fire", label: "Flammable Liquids & Hazardous Materials Fire Permit", responsible: "Fire & Rescue Services", required: true },
    ],
  },
  {
    id: "fuel_distribution",
    name: "Fuel & LPG Gas Distribution",
    category: "Industrial",
    icon: Zap,
    formType: "FORM LCC/EN-02",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "erb_lpg_license", label: "ERB Licence to Distribute / Store LPG", responsible: "ERB", required: true, note: "Energy Regulation Board compliance" },
      { id: "zema_epb", label: "ZEMA Environmental Project Brief (EPB)", responsible: "ZEMA", required: true },
      { id: "explosion_safety", label: "Explosion Prevention & Safety System Certification", responsible: "Fire & Rescue Services", required: true },
    ],
  },
  {
    id: "manufacturer",
    name: "Manufacturing & Industrial Plant",
    category: "Industrial",
    icon: Factory,
    formType: "FORM LCC/MF-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "zema_eia", label: "ZEMA Environmental Protection / EIA Licence", responsible: "ZEMA", required: true, note: "Approved Environmental Impact Assessment" },
      { id: "factories_cert", label: "Factories Act Registration & OHS Compliance", responsible: "Ministry of Labour", required: true, note: "Occupational health and safety audit" },
      { id: "zabs_cert", label: "Zambia Bureau of Standards (ZABS) Quality Mark", responsible: "ZABS", required: false, note: "For consumer manufactured products" },
      { id: "effluent_agreement", label: "Industrial Effluent Discharge Agreement", responsible: "Commercial Water Utility", required: true, note: "LWSC / Utility trade effluent permit" },
    ],
  },

  // Food & Health
  {
    id: "food_establishment",
    name: "Restaurant & Food Outlet",
    category: "Health",
    icon: Utensils,
    formType: "FORM LCC/FD-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "food_handler_meds", label: "Food Handler Medical Certificates (Form Med 1)", responsible: "Public Health Dept", required: true, note: "Mandatory medical tests for all food handlers" },
      { id: "pest_control", label: "Pest Control & Fumigation Contract", responsible: "Applicant", required: true, note: "Quarterly pest management contract" },
      { id: "grease_trap", label: "Grease Trap & Kitchen Drainage Clearance", responsible: "Council", required: true },
    ],
  },
  {
    id: "pharmacy",
    name: "Retail Pharmacy & Agro-Vet",
    category: "Health",
    icon: Pill,
    formType: "FORM LCC/PH-01",
    checklist: [
      ...COMMON_REQUIREMENTS,
      { id: "zamra_license", label: "ZAMRA Retail Pharmacy Premises Licence", responsible: "ZAMRA", required: true, note: "Medicines and Allied Substances Act No. 3 of 2013" },
      { id: "pharmacist_license", label: "Registered Pharmacist Annual Practicing Licence", responsible: "ZAMRA", required: true, note: "Health Professions Council of Zambia (HPCZ) certificate" },
      { id: "cold_chain", label: "Medicine Cold Chain & Storage Inspection Clearance", responsible: "Public Health Dept", required: true },
    ],
  },

  // Liquor Licenses (Liquor Licensing Act No. 20 of 2011)
  {
    id: "tavern",
    name: "Bar & Tavern License",
    category: "Liquor",
    icon: Wine,
    formType: "Form 1 (Liquor Act 2011)",
    checklist: LIQUOR_REQUIREMENTS,
  },
  {
    id: "limited_hotel",
    name: "Hotel & Lodge Liquor License",
    category: "Liquor",
    icon: Hotel,
    formType: "Form 5 (Liquor Act 2011)",
    checklist: [
      ...LIQUOR_REQUIREMENTS,
      { id: "zta_license", label: "Zambia Tourism Agency (ZTA) Enterprise Licence", responsible: "ZTA", required: true, note: "Tourism and Hospitality Act compliance" },
    ],
  },
  {
    id: "publican",
    name: "Publican License",
    category: "Liquor",
    icon: Users,
    formType: "Form 1 (Liquor Act 2011)",
    checklist: LIQUOR_REQUIREMENTS,
  },
  {
    id: "restaurant_liquor",
    name: "Restaurant Liquor License",
    category: "Liquor",
    icon: Utensils,
    formType: "Form 4 (Liquor Act 2011)",
    checklist: [
      ...LIQUOR_REQUIREMENTS,
      { id: "food_handler_meds", label: "Food Handler Medical Certificates (Form Med 1)", responsible: "Public Health Dept", required: true },
    ],
  },
  {
    id: "club_liquor",
    name: "Private Club Liquor License",
    category: "Liquor",
    icon: Users,
    formType: "Form 6 (Liquor Act 2011)",
    checklist: [
      ...LIQUOR_REQUIREMENTS,
      { id: "constitution", label: "Club Constitution & By-Laws", responsible: "Applicant", required: true, note: "Registered club constitution" },
      { id: "members_list", label: "Certified List of Subscribing Members (> 50)", responsible: "Applicant", required: true },
      { id: "agm_minutes", label: "Annual General Meeting (AGM) Minutes", responsible: "Applicant", required: true },
    ],
  },
  {
    id: "storekeepers",
    name: "Storekeepers / Bottle Store (Off-Consumption)",
    category: "Liquor",
    icon: Store,
    formType: "Form 3 (Liquor Act 2011)",
    checklist: LIQUOR_REQUIREMENTS,
  },
  {
    id: "dealer_liquor",
    name: "Wholesale Liquor Dealer License",
    category: "Liquor",
    icon: Truck,
    formType: "Form 2 (Liquor Act 2011)",
    checklist: [
      ...LIQUOR_REQUIREMENTS,
      { id: "excise_license", label: "ZRA Excise Manufacturer / Brewer Licence", responsible: "ZRA", required: false, note: "Applicable if brewing or blending alcoholic beverages" },
    ],
  },
  {
    id: "packet_license",
    name: "Packet License (Inland Vessels & Houseboats)",
    category: "Liquor",
    icon: Anchor,
    formType: "Form 7 (Liquor Act 2011)",
    checklist: [
      { id: "app_form", label: "Completed Liquor Form 7", responsible: "Council", required: true },
      { id: "pacra_cert", label: "PACRA Business Registration", responsible: "PACRA", required: true },
      { id: "vessel_safety", label: "Certified Inland Waterways Vessel Safety Certificate", responsible: "Applicant", required: true, note: "Ministry of Transport / Maritime clearance" },
      { id: "captain_id", label: "Licensed Vessel Master / Captain NRC & License", responsible: "Applicant", required: true },
      { id: "police_clearance", label: "Zambia Police Service Clearance", responsible: "Zambia Police Service", required: true },
      { id: "statutory_declaration", label: "Statutory Declaration", responsible: "Commissioner for Oaths", required: true },
    ],
  },
  {
    id: "booth_license",
    name: "Occasional / Booth Liquor Permit",
    category: "Liquor",
    icon: Store,
    formType: "Form 7 (Liquor Act 2011)",
    checklist: [
      { id: "app_form", label: "Application for Occasional Liquor Permit", responsible: "Council", required: true },
      { id: "venue_consent", label: "Venue Management Written Consent & Contract", responsible: "Applicant", required: true },
      { id: "police_event", label: "Zambia Police Service Event Security Clearance", responsible: "Zambia Police Service", required: true },
      { id: "floor_plan", label: "Event Layout & Designated Alcohol Dispensing Area", responsible: "Applicant", required: true },
      { id: "temporary_sanitation", label: "Public Health Sanitation & Mobile Toilet Plan", responsible: "Public Health Dept", required: true },
      { id: "event_fire_plan", label: "Event Fire Safety & Evacuation Plan", responsible: "Fire & Rescue Services", required: true },
      { id: "parent_liquor_license", label: "Certified Copy of Current Bar/Publican Licence", responsible: "Applicant", required: true, note: "Service must be managed by a licensed liquor licensee" },
      { id: "statutory_declaration", label: "Statutory Declaration", responsible: "Commissioner for Oaths", required: true },
    ],
  },
];
