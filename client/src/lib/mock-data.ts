import { User, Shield, FileText, Users, Building2, CreditCard, LayoutDashboard, Settings, ClipboardCheck, AlertTriangle, Sliders, MessageSquare, Map as MapIcon, Activity } from "lucide-react";

export const MOCK_COUNCILS = [
  { id: "ec9b95a7-c085-4b88-a391-e3c84d7128ce", name: "Lusaka City Council", type: "City", district: "Lusaka" },
  { id: "2", name: "Ndola City Council", type: "City", district: "Ndola" },
  { id: "3", name: "Kitwe City Council", type: "City", district: "Kitwe" },
  { id: "4", name: "Livingstone City Council", type: "City", district: "Livingstone" },
];

export const MOCK_USERS = [
  { id: "u1", name: "Inspector Mwape", role: "Public Health Officer", email: "mwape.k@lcc.gov.zm", avatar: "MK" },
  { id: "u2", name: "Inspector Phiri", role: "Compliance Officer", email: "phiri.c@lcc.gov.zm", avatar: "CP" },
  { id: "u3", name: "Officer Banda", role: "Revenue Officer", email: "banda.t@lcc.gov.zm", avatar: "TB" },
];

export const MOCK_STATS = [
  { title: "Total Revenue (YTD)", value: "ZMW 4.2M", change: "+12%", trend: "up" },
  { title: "Active Licenses", value: "8,450", change: "+5%", trend: "up" },
  { title: "Pending Inspections", value: "145", change: "+12%", trend: "down" },
  { title: "Citizen Requests", value: "328", change: "+8%", trend: "up" },
];

export const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Registry", url: "/registry", icon: Users },
  { title: "Services", url: "/services", icon: FileText },
  { title: "Licensing", url: "/licensing", icon: Shield },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Enforcement", url: "/enforcement", icon: AlertTriangle },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Revenue", url: "/revenue", icon: CreditCard },
  { title: "Public Interaction", url: "/complaints", icon: MessageSquare },
  { title: "GIS & Maps", url: "/gis", icon: MapIcon },
  { title: "Audit Logs", url: "/audit", icon: Activity },
  { title: "Configuration", url: "/configuration", icon: Sliders },
];

export const MOCK_INSPECTIONS = [
  { id: "INS-2026-001", entity: "Trade Kings Limited", type: "Health & Safety", date: "2026-02-15", inspector: "Inspector Mwape", status: "Completed", result: "Pass", risk: "Low" },
  { id: "INS-2026-002", entity: "Choppies Supermarket Cairo Road", type: "License Compliance", date: "2026-02-14", inspector: "Inspector Phiri", status: "Completed", result: "Pass", risk: "Low" },
  { id: "INS-2026-003", entity: "Woodlands Heights Pharmacy", type: "Premises & Storage", date: "2026-02-10", inspector: "Inspector Mwape", status: "Scheduled", risk: "Medium" },
  { id: "INS-2026-004", entity: "Chilenje Fresh Food Mart", type: "Food Hygiene", date: "2026-02-16", inspector: "Officer Banda", status: "Scheduled", risk: "Medium" },
];

export const MOCK_PENALTIES = [
  { id: "INF-2026-88", entity: "Unauthorized Signage Vendor", type: "Outdoor Advertising Violation", date: "2026-02-11", amount: "ZMW 5,000.00", status: "Issued", dueDate: "2026-03-11" },
  { id: "INF-2026-45", entity: "Unregistered Retail Stall", type: "Unlicensed Trading", date: "2026-01-20", amount: "ZMW 1,500.00", status: "Overdue", dueDate: "2026-02-05" },
  { id: "INF-2026-12", entity: "Commercial Truck CBD", type: "Loading Zone Obstruction", date: "2026-02-01", amount: "ZMW 850.00", status: "Paid", dueDate: "2026-02-15" },
];

export const MOCK_COMPLAINTS = [
  { id: "CASE-101", subject: "Drainage Maintenance on Church Road", category: "Infrastructure", date: "2026-02-18", priority: "High", status: "In Progress" },
  { id: "CASE-102", subject: "Commercial Waste Clearance - Soweto Market", category: "Waste Management", date: "2026-02-17", priority: "Medium", status: "Resolved" },
  { id: "CASE-103", subject: "Street Lighting Inspection - Great East Road", category: "Infrastructure", date: "2026-02-15", priority: "Low", status: "Resolved" },
];

export const MOCK_ASSETS = [
  { id: "AST-001", name: "Lusaka Civic Centre HQ", type: "Civic Headquarters", location: "Independence Avenue", condition: "Excellent", value: "ZMW 45,000,000" },
  { id: "AST-002", name: "Soweto Wholesale Market Complex", type: "Market Facility", location: "Lumumba Road", condition: "Good", value: "ZMW 18.5M" },
  { id: "AST-003", name: "Scania Rapid Fire Tender (Fleet #1)", type: "Emergency Vehicle", location: "Central Fire Station", condition: "Excellent", value: "ZMW 3,800,000" },
];

export const MOCK_AUDIT_LOGS = [
  { id: "LOG-9001", user: "Inspector Mwape", action: "Approved License", resource: "LCC/TL/2026/0001", timestamp: "2026-01-14 10:30:00", ip: "192.168.1.45" },
  { id: "LOG-9002", user: "System", action: "Generated Invoice", resource: "INV-2026-LCC-0001", timestamp: "2026-01-14 10:35:12", ip: "System" },
  { id: "LOG-9003", user: "Administrator", action: "Updated Tariff Rates", resource: "Commercial Trading License Class A", timestamp: "2026-01-13 16:20:00", ip: "192.168.1.10" },
  { id: "LOG-9004", user: "Inspector Phiri", action: "Completed Inspection", resource: "INS-2026-001", timestamp: "2026-01-13 09:15:00", ip: "192.168.1.22" },
];

export const MOCK_GIS_POINTS = [
  { id: "P-001", lat: -15.4285, lng: 28.2520, type: "License", status: "Active", label: "Trade Kings Limited" },
  { id: "P-002", lat: -15.4192, lng: 28.2815, type: "Inspection", status: "Completed", label: "Choppies Supermarket Cairo Rd" },
  { id: "P-003", lat: -15.4150, lng: 28.2910, type: "License", status: "Active", label: "Zambeef Arcadia Hub" },
  { id: "P-004", lat: -15.4180, lng: 28.2750, type: "Asset", status: "Good", label: "Soweto Wholesale Market" },
];

export const MOCK_INVOICES = [
  { id: "INV-2026-001", recipient: "Trade Kings Limited", description: "Annual Commercial License 2026", amount: "ZMW 15,000.00", date: "2026-01-01", status: "Paid" },
  { id: "INV-2026-002", recipient: "Choppies Supermarkets Ltd", description: "Trading License Renewal", amount: "ZMW 4,500.00", date: "2026-01-10", status: "Paid" },
  { id: "INV-2026-003", recipient: "Zambeef Products PLC", description: "Commercial Property Rates (Q1)", amount: "ZMW 28,000.00", date: "2026-01-12", status: "Paid" },
  { id: "INV-2026-004", recipient: "Mukuba Trading & Logistics", description: "Signage & Advertising Permit", amount: "ZMW 3,200.00", date: "2026-01-15", status: "Unpaid" },
];
