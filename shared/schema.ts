import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, date, char, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ================================
// COUNTRIES (TENANT REGISTRY)
// ================================

export const countries = pgTable("countries", {
  countryId: varchar("country_id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: char("country_code", { length: 2 }).notNull().unique(), // ISO 3166-1 alpha-2
  name: text("name").notNull(),
  currencyCode: char("currency_code", { length: 3 }).notNull(),
  currencySymbol: text("currency_symbol").notNull().default("$"),
  timezone: text("timezone").notNull(),
  locale: text("locale").default("en"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  flagEmoji: text("flag_emoji"),
  status: text("status").notNull().default("active"), // active, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// COUNCILS & ORGANISATION STRUCTURE
// ================================

export const councils = pgTable("councils", {
  councilId: varchar("council_id").primaryKey().default(sql`gen_random_uuid()`),
  countryId: varchar("country_id").references(() => countries.countryId, { onDelete: "set null" }), // nullable FK to tenant
  name: text("name").notNull(),
  level: text("level").notNull(), // city, municipal, district, llg
  countryCode: char("country_code", { length: 2 }).notNull().default("PG"),
  currencyCode: char("currency_code", { length: 3 }).notNull().default("PGK"),
  timezone: text("timezone").notNull().default("Pacific/Port_Moresby"),
  status: text("status").notNull().default("active"),
  // Branding & Configuration
  logoUrl: text("logo_url"),
  themeColor: text("theme_color").default("#EAB308"), // Yellow-500
  fontFamily: text("font_family").default("Inter"),
  // Contact Details
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  // Localization
  dateFormat: text("date_format").default("dd/MM/yyyy"),
  timeFormat: text("time_format").default("HH:mm"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const councilUnits = pgTable("council_units", {
  unitId: varchar("unit_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // department, division, branch
  parentUnitId: varchar("parent_unit_id"),
});

// ================================
// USERS, ROLES, PERMISSIONS (RBAC + LBAC)
// ================================

export const users = pgTable("users", {
  userId: varchar("user_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  unitId: varchar("unit_id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  nationalId: text("national_id"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"),
  role: text("role").notNull().default("user"), // admin, user, inspector, etc.
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  roleId: varchar("role_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  name: text("name").notNull(),
  scope: text("scope").notNull().default("council"), // council, unit, ward, location
});

export const permissions = pgTable("permissions", {
  permissionCode: text("permission_code").primaryKey(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: varchar("role_id").notNull(),
  permissionCode: text("permission_code").notNull(),
});

export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id").notNull(),
  roleId: varchar("role_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// ================================
// AUDIT LOGS (IMMUTABLE)
// ================================

export const auditLogs = pgTable("audit_logs", {
  auditId: varchar("audit_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  userId: varchar("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// SESSIONS (Persistent Store)
// ================================
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ================================
// CITIZENS, BUSINESSES & ACCOUNTS
// ================================

export const citizens = pgTable("citizens", {
  citizenId: varchar("citizen_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  userId: varchar("user_id"), // Proactively added for Public Portal
  nationalId: text("national_id"),
  localCitizenNo: text("local_citizen_no"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dob: date("dob"),
  sex: text("sex"), // male, female
  phone: text("phone"),
  email: text("email"),
  address: text("address"), // Street name or description
  section: text("section"),
  lot: text("lot"),
  block: text("block"),
  suburb: text("suburb"),
  village: text("village"),
  district: text("district"),
  province: text("province"),
  nationality: text("nationality"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  businessId: varchar("business_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  registrationNo: text("registration_no"),
  tin: text("tin"), // Tax Identification Number
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name"),
  businessType: text("business_type"), // Sole Trader, Partnership, Company
  industry: text("industry"),
  ownerName: text("owner_name"), // Legacy field, to be deprecated
  ownerUserId: varchar("owner_user_id"), // Link to user
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  physicalAddress: text("physical_address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  section: text("section"),
  lot: text("lot"),
  block: text("block"),
  suburb: text("suburb"),
  village: text("village"),
  district: text("district"),
  province: text("province"),
  status: text("status").default("pending_verification"), // pending_verification, verified, rejected
  isForeignEnterprise: boolean("is_foreign_enterprise").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  documentId: varchar("document_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  ownerType: text("owner_type").notNull(), // business, licence, user
  ownerId: varchar("owner_id").notNull(),
  type: text("type").notNull(), // certificate, id, lease, other
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessVerificationRequests = pgTable("business_verification_requests", {
  requestId: varchar("request_id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  councilId: varchar("council_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, more_info
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  comments: text("comments"),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // email or phone
  code: text("code").notNull(),
  type: text("type").notNull(), // email, sms
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  accountId: varchar("account_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  holderType: text("holder_type").notNull(), // citizen, business
  holderId: varchar("holder_id").notNull(),
  accountNo: text("account_no").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// SERVICE CATALOGUE & FEES
// ================================

export const services = pgTable("services", {
  serviceId: varchar("service_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // licensing, permits, rates, complaints
  description: text("description"),
  requiresInspection: boolean("requires_inspection").default(false),
  requiresApproval: boolean("requires_approval").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feeSchedules = pgTable("fee_schedules", {
  feeId: varchar("fee_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  name: text("name").notNull(),
  basis: text("basis").notNull(), // flat, per_unit, percentage
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull().default("PGK"),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
});

// ================================
// WORKFLOWS & SERVICE REQUESTS
// ================================

export const workflowDefinitions = pgTable("workflow_definitions", {
  workflowId: varchar("workflow_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  version: text("version").notNull().default("1.0"),
  name: text("name"),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrationConfigs = pgTable("integration_configs", {
  configId: varchar("config_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").default("disconnected"),
  lastSyncAt: timestamp("last_sync_at"),
  description: text("description"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowSteps = pgTable("workflow_steps", {
  stepId: varchar("step_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  workflowId: varchar("workflow_id").notNull(),
  name: text("name").notNull(),
  orderNo: integer("order_no").notNull(),
  assigneeRole: text("assignee_role"),
  slaRule: text("sla_rule"), // e.g., "3_business_days"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceRequests = pgTable("service_requests", {
  requestId: varchar("request_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  requesterType: text("requester_type").notNull(), // citizen, business
  requesterId: varchar("requester_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, submitted, processing, approved, rejected
  channel: text("channel").notNull().default("web"), // web, mobile, counter
  formData: jsonb("form_data"),
  processingData: jsonb("processing_data"), // For officer use: payments, approvals, meeting notes
  requestRef: text("request_ref"), // Human readable ID e.g. "LIC-2024-001"
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  inspectedAt: timestamp("inspected_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  notificationId: varchar("notification_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // info, success, warning, error
  title: text("title").notNull(),
  message: text("message").notNull(),
  referenceType: text("reference_type"), // service_request, payment, etc
  referenceId: varchar("reference_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowInstances = pgTable("workflow_instances", {
  instanceId: varchar("instance_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  requestId: varchar("request_id").notNull(),
  workflowId: varchar("workflow_id").notNull(),
  state: text("state").notNull().default("pending"),
  currentStepId: varchar("current_step_id"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// ================================
// INSPECTIONS & FIELD DATA
// ================================

export const inspections = pgTable("inspections", {
  inspectionId: varchar("inspection_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  requestId: varchar("request_id"),
  inspectorUserId: varchar("inspector_user_id"),
  scheduledAt: timestamp("scheduled_at"),
  performedAt: timestamp("performed_at"),
  result: text("result"), // pass, fail, conditional_pass
  remarks: text("remarks"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspectionFindings = pgTable("inspection_findings", {
  findingId: varchar("finding_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  inspectionId: varchar("inspection_id").notNull(),
  code: text("code"),
  severity: text("severity"), // low, medium, high, critical
  description: text("description"),
  correctiveAction: text("corrective_action"),
  dueDate: date("due_date"),
});

export const inspectionEvidence = pgTable("inspection_evidence", {
  evidenceId: varchar("evidence_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  inspectionId: varchar("inspection_id").notNull(),
  mediaType: text("media_type"), // photo, video, document
  url: text("url"),
  title: text("title"),
  signatureUrl: text("signature_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// BILLING, PAYMENTS & LICENSING
// ================================

export const invoices = pgTable("invoices", {
  invoiceId: varchar("invoice_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  accountId: varchar("account_id").notNull(),
  invoiceNo: text("invoice_no").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull().default("PGK"),
  status: text("status").notNull().default("draft"), // draft, issued, paid, overdue, cancelled
  issuedAt: timestamp("issued_at"),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoiceLines = pgTable("invoice_lines", {
  lineId: varchar("line_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  invoiceId: varchar("invoice_id").notNull(),
  description: text("description"),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }),
});

export const payments = pgTable("payments", {
  paymentId: varchar("payment_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  accountId: varchar("account_id").notNull(),
  paymentRef: text("payment_ref").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull().default("PGK"),
  method: text("method").notNull(), // cash, eftpos, bank_transfer, mobile_money
  provider: text("provider"), // BSP, Kina Bank, etc.
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  externalReference: text("external_reference"),
  paymentDetails: jsonb("payment_details"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentAllocations = pgTable("payment_allocations", {
  allocationId: varchar("allocation_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  paymentId: varchar("payment_id").notNull(),
  invoiceId: varchar("invoice_id").notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 12, scale: 2 }).notNull(),
});

export const licences = pgTable("licences", {
  licenceId: varchar("licence_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  requestId: varchar("request_id").notNull(),
  licenceNo: text("licence_no").notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  status: text("status").notNull().default("active"), // active, expired, suspended, revoked
  licencePayloadHash: text("licence_payload_hash"),
  pdfHash: text("pdf_hash"),
  signedPdfHash: text("signed_pdf_hash"),
  signatureMetadata: jsonb("signature_metadata"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const licenceRenewals = pgTable("licence_renewals", {
  renewalId: varchar("renewal_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  licenceId: varchar("licence_id").notNull(),
  requestId: varchar("request_id"),
  previousExpiryDate: date("previous_expiry_date"),
  newExpiryDate: date("new_expiry_date"),
  renewedAt: timestamp("renewed_at").defaultNow(),
});

// ================================
// PROPERTIES & RATES
// ================================

export const properties = pgTable("properties", {
  propertyId: varchar("property_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  parcelId: text("parcel_id"),
  section: text("section"),
  lot: text("lot"),
  allotment: text("allotment"),
  suburb: text("suburb"),
  district: text("district"),
  landType: text("land_type"), // state_lease, customary, freehold
  titleNumber: text("title_number"),
  ownerName: text("owner_name"),
  ownerType: text("owner_type"), // individual, business, government
  landArea: text("land_area"),
  zoning: text("zoning"),
  rateableValue: decimal("rateable_value", { precision: 12, scale: 2 }),
  coordinates: text("coordinates"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rateAssessments = pgTable("rate_assessments", {
  assessmentId: varchar("assessment_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  assessmentYear: integer("assessment_year").notNull(),
  rateableValue: decimal("rateable_value", { precision: 12, scale: 2 }),
  rateAmount: decimal("rate_amount", { precision: 12, scale: 2 }),
  status: text("status").default("pending"), // pending, issued, paid, overdue
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// MARKETS & STALLS
// ================================

export const markets = pgTable("markets", {
  marketId: varchar("market_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  name: text("name").notNull(),
  location: text("location"),
  capacity: integer("capacity"),
  operatingHours: text("operating_hours"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stalls = pgTable("stalls", {
  stallId: varchar("stall_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  marketId: varchar("market_id").notNull(),
  stallNo: text("stall_no").notNull(),
  category: text("category"), // produce, crafts, food, general
  size: text("size"),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }),
  status: text("status").default("available"), // available, occupied, reserved, maintenance
  currentTenantId: varchar("current_tenant_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// COMPLAINTS & SERVICE REQUESTS
// ================================

export const complaints = pgTable("complaints", {
  complaintId: varchar("complaint_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  complainantType: text("complainant_type"), // citizen, business, anonymous
  complainantId: varchar("complainant_id"),
  category: text("category"), // noise, littering, illegal_business, road_damage
  status: text("status").notNull().default("new"), // new, acknowledged, investigating, resolved, closed
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaintUpdates = pgTable("complaint_updates", {
  updateId: varchar("update_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  complaintId: varchar("complaint_id").notNull(),
  updatedBy: varchar("updated_by"),
  status: text("status"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// ASSETS & FACILITIES
// ================================

// ================================
// ASSETS & FACILITIES
// ================================

export const assets = pgTable("assets", {
  assetId: varchar("asset_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  assetNo: text("asset_no").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // building, vehicle, equipment, market_facility
  location: text("location"),
  condition: text("condition"), // excellent, good, fair, poor
  value: text("value"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// LICENSING REFERENCE DATA
// ================================

export const licenseTypes = pgTable("license_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseCode: text("license_code"),
  licenseName: text("license_name").notNull(),
  licenseCategory: text("license_category").notNull(), // TRADE, ENTERTAINMENT, HEALTH, etc.
  applicationForm: text("application_form"), // FORM.1, FORM.5 etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checklistRequirements = pgTable("checklist_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseTypeId: varchar("license_type_id").notNull(),
  itemNumber: integer("item_number").notNull(),
  documentName: text("document_name").notNull(),
  responsibleEntity: text("responsible_entity"),
  requirementNote: text("requirement_note"),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const specialRequirements = pgTable("special_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseTypeId: varchar("license_type_id").notNull(),
  requirementName: text("requirement_name").notNull(),
  issuingAuthority: text("issuing_authority"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// LOCATIONS & GIS
// ================================

export const locationLevels = pgTable("location_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  name: text("name").notNull(), // e.g. "Section", "Lot"
  level: integer("level").notNull(), // 1, 2, 3, 4
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const licenseTypeFees = pgTable("license_type_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseTypeId: varchar("license_type_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PGK"),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  levelId: varchar("level_id").notNull(), // Link to definitions
  code: text("code").notNull(), // "390", "01"
  parentId: varchar("parent_id"), // Parent location UUID
  boundary: jsonb("boundary"), // GeoJSON Polygon
  centroid: text("centroid"), // "lat,lng"
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// ENFORCEMENT CASES & NOTICES
// ================================

export const enforcementCases = pgTable("enforcement_cases", {
  caseId: varchar("case_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  requestId: varchar("request_id"),
  caseNo: text("case_no").notNull(),
  type: text("type"), // non_compliance, illegal_activity, penalty
  status: text("status").default("open"), // open, investigating, pending_prosecution, closed
  offenderType: text("offender_type"), // citizen, business
  offenderId: varchar("offender_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  noticeId: varchar("notice_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  caseId: varchar("case_id").notNull(),
  noticeNo: text("notice_no").notNull(),
  noticeType: text("notice_type"), // warning, compliance, penalty, closure
  issuedDate: date("issued_date"),
  complianceDue: date("compliance_due"),
  details: text("details"),
  status: text("status").default("issued"), // issued, served, complied, escalated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  orderId: varchar("order_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  vendorId: varchar("vendor_id").notNull(), // Link to businesses
  requestorId: varchar("requestor_id"), // Link to users
  orderDate: date("order_date").defaultNow(),
  expectedDate: date("expected_date"),
  status: text("status").default("draft"), // draft, submitted, approved, received, cancelled
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0"),
  currency: char("currency", { length: 3 }).default("PGK"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  lineId: varchar("line_id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

// ================================
// TENANT CONFIGURATION
// ================================
export const tenantConfig = pgTable('tenant_config', {
  configId: uuid('config_id').primaryKey().defaultRandom(),
  councilId: varchar('council_id').references(() => councils.councilId, { onDelete: 'cascade' }).notNull(),

  // Branding & Identity
  councilName: text('council_name'),
  shortName: text('short_name'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  tagline: text('tagline'),

  // Theme Configuration (AI-extracted or manual)
  primaryColor: text('primary_color').default('#1e40af'),
  secondaryColor: text('secondary_color').default('#7c3aed'),
  accentColor: text('accent_color').default('#f59e0b'),
  backgroundRootColor: text('background_root_color').default('#EBECED'),
  backgroundDefaultColor: text('background_default_color').default('#FCFCFC'),
  backgroundHigherColor: text('background_higher_color').default('#F0F1F2'),
  foregroundDefaultColor: text('foreground_default_color').default('#07080A'),
  foregroundDimmerColor: text('foreground_dimmer_color').default('#3D4047'),
  outlineColor: text('outline_color').default('#C0C3C4'),

  // Advanced Color Overrides
  primaryForeground: text('primary_foreground'),
  positiveColor: text('positive_color').default('#10b981'),
  warningColor: text('warning_color').default('#f59e0b'),
  negativeColor: text('negative_color').default('#ef4444'),

  sidebarBackground: text('sidebar_background'),
  sidebarForeground: text('sidebar_foreground'),
  headerBackground: text('header_background'),
  headerForeground: text('header_foreground'),
  cardBackground: text('card_background'),

  // Component Styling
  borderRadius: integer('border_radius').default(4),
  buttonRadius: integer('button_radius').default(4),
  cardRadius: integer('card_radius').default(8),
  inputRadius: integer('input_radius').default(4),

  fontFamily: text('font_family').default('Inter'),

  // Location Hierarchy
  locationLevels: jsonb('location_levels').$type<string[]>().default(['Country', 'Province', 'District', 'Ward']),

  // Localization Settings
  locale: text('locale').default('en-PG'),
  timezone: text('timezone').default('Pacific/Port_Moresby'),
  dateFormat: text('date_format').default('DD/MM/YYYY'),
  timeFormat: text('time_format').default('HH:mm'),
  firstDayOfWeek: text('first_day_of_week').default('monday'),

  // Currency & Formatting
  currency: text('currency').default('PGK'),
  currencySymbol: text('currency_symbol').default('K'),
  currencyPosition: text('currency_position').default('before'),
  decimalSeparator: text('decimal_separator').default('.'),
  thousandsSeparator: text('thousands_separator').default(','),

  // Contact Information
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  emergencyContact: text('emergency_contact'),

  // Social Media
  facebook: text('facebook'),
  twitter: text('twitter'),
  linkedin: text('linkedin'),

  // System Settings
  enableMultiLanguage: text('enable_multi_language').default('false'),
  supportedLanguages: jsonb('supported_languages').$type<string[]>().default(['en']),
  enabledModules: jsonb('enabled_modules').$type<string[]>().default(['registry', 'licensing', 'services', 'payments', 'portal']),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const dynamicLocations = pgTable('dynamic_locations', {
  locationId: uuid('location_id').primaryKey().defaultRandom(),
  councilId: varchar('council_id').references(() => councils.councilId, { onDelete: 'cascade' }).notNull(),
  level: text('level').notNull(),
  levelIndex: text('level_index').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  parentId: uuid('parent_id'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  bounds: jsonb('bounds'),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ================================
// INSERT SCHEMAS (for validation)
// ================================

export const insertCouncilSchema = createInsertSchema(councils).omit({ councilId: true, createdAt: true });
export const insertCouncilUnitSchema = createInsertSchema(councilUnits).omit({ unitId: true });
export const insertUserSchema = createInsertSchema(users).omit({ userId: true, createdAt: true, lastLoginAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ roleId: true });
export const insertPermissionSchema = createInsertSchema(permissions);
export const insertCitizenSchema = createInsertSchema(citizens).omit({ citizenId: true, createdAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ businessId: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ accountId: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ serviceId: true, createdAt: true });
export const insertFeeScheduleSchema = createInsertSchema(feeSchedules).omit({ feeId: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ requestId: true, createdAt: true });
export const insertInspectionSchema = createInsertSchema(inspections, {
  scheduledAt: z.coerce.date().optional().nullable(),
  performedAt: z.coerce.date().optional().nullable(),
  requestId: z.string().optional().nullable(),
  inspectorUserId: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
}).omit({ inspectionId: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ invoiceId: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ paymentId: true, createdAt: true });
export const insertLicenceSchema = createInsertSchema(licences).omit({ licenceId: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ propertyId: true, createdAt: true });
export const insertMarketSchema = createInsertSchema(markets).omit({ marketId: true, createdAt: true });
export const insertStallSchema = createInsertSchema(stalls).omit({ stallId: true, createdAt: true });
export const insertComplaintSchema = createInsertSchema(complaints).omit({ complaintId: true, createdAt: true });
export const insertEnforcementCaseSchema = createInsertSchema(enforcementCases).omit({ caseId: true, createdAt: true });
export const insertNoticeSchema = createInsertSchema(notices).omit({ noticeId: true, createdAt: true });

// ================================
// FIELD POLICIES (RBAC)
// ================================
export const fieldPolicies = pgTable("field_policies", {
  policyId: varchar("policy_id").primaryKey().default(sql`gen_random_uuid()`),
  councilId: varchar("council_id").notNull(),
  entity: text("entity").notNull(), // citizen, business, etc.
  field: text("field").notNull(),
  public: text("public").notNull().default("full"), // full, masked, partial, none
  officer: text("officer").notNull().default("full"),
  manager: text("manager").notNull().default("full"),
  admin: text("admin").notNull().default("full"),
  breakGlass: text("break_glass").notNull().default("full"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFieldPolicySchema = createInsertSchema(fieldPolicies).omit({ policyId: true, updatedAt: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ auditId: true, createdAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ assetId: true, createdAt: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ orderId: true, createdAt: true });
export const insertPurchaseOrderLineSchema = createInsertSchema(purchaseOrderLines).omit({ lineId: true });
export const insertLicenseTypeSchema = createInsertSchema(licenseTypes).omit({ id: true, createdAt: true });
export const insertChecklistRequirementSchema = createInsertSchema(checklistRequirements).omit({ id: true, createdAt: true });
export const insertSpecialRequirementSchema = createInsertSchema(specialRequirements).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ documentId: true, createdAt: true });
export const insertBusinessVerificationRequestSchema = createInsertSchema(businessVerificationRequests).omit({ requestId: true, submittedAt: true });

export const insertLocationLevelSchema = createInsertSchema(locationLevels).omit({ id: true, createdAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });

export const insertTenantConfigSchema = createInsertSchema(tenantConfig).omit({ configId: true, createdAt: true, updatedAt: true });
export const insertDynamicLocationSchema = createInsertSchema(dynamicLocations).omit({ locationId: true, createdAt: true, updatedAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ notificationId: true, createdAt: true });
export const insertLicenseTypeFeeSchema = createInsertSchema(licenseTypeFees, {
  effectiveDate: z.coerce.date().optional()
}).omit({ id: true, createdAt: true });

export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).omit({ workflowId: true, createdAt: true });
export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({ stepId: true });
export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({ configId: true, createdAt: true });

// ================================
// TYPE EXPORTS
// ================================

export type Council = typeof councils.$inferSelect;
export type InsertCouncil = z.infer<typeof insertCouncilSchema>;
export type CouncilUnit = typeof councilUnits.$inferSelect;
export type InsertCouncilUnit = z.infer<typeof insertCouncilUnitSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type FeeSchedule = typeof feeSchedules.$inferSelect;
export type InsertFeeSchedule = z.infer<typeof insertFeeScheduleSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type BusinessVerificationRequest = typeof businessVerificationRequests.$inferSelect;
export type InsertBusinessVerificationRequest = z.infer<typeof insertBusinessVerificationRequestSchema>;

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type WorkflowInstance = typeof workflowInstances.$inferSelect;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type InspectionFinding = typeof inspectionFindings.$inferSelect;
export type InspectionEvidence = typeof inspectionEvidence.$inferSelect;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;

export type Licence = typeof licences.$inferSelect;
export type InsertLicence = z.infer<typeof insertLicenceSchema>;
export type LicenceRenewal = typeof licenceRenewals.$inferSelect;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type RateAssessment = typeof rateAssessments.$inferSelect;

export type Market = typeof markets.$inferSelect;
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Stall = typeof stalls.$inferSelect;
export type InsertStall = z.infer<typeof insertStallSchema>;

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type ComplaintUpdate = typeof complaintUpdates.$inferSelect;

export type EnforcementCase = typeof enforcementCases.$inferSelect;
export type InsertEnforcementCase = z.infer<typeof insertEnforcementCaseSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;
export type InsertPurchaseOrderLine = z.infer<typeof insertPurchaseOrderLineSchema>;

export type LicenseType = typeof licenseTypes.$inferSelect;
export type InsertLicenseType = z.infer<typeof insertLicenseTypeSchema>;

export type ChecklistRequirement = typeof checklistRequirements.$inferSelect;
export type InsertChecklistRequirement = z.infer<typeof insertChecklistRequirementSchema>;

export type SpecialRequirement = typeof specialRequirements.$inferSelect;
export type InsertSpecialRequirement = z.infer<typeof insertSpecialRequirementSchema>;

export type LicenseTypeFee = typeof licenseTypeFees.$inferSelect;
export type InsertLicenseTypeFee = z.infer<typeof insertLicenseTypeFeeSchema>;

export type LocationLevel = typeof locationLevels.$inferSelect;
export type InsertLocationLevel = z.infer<typeof insertLocationLevelSchema>;


export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type TenantConfig = typeof tenantConfig.$inferSelect;
export type InsertTenantConfig = z.infer<typeof insertTenantConfigSchema>;
export type DynamicLocation = typeof dynamicLocations.$inferSelect;
export type InsertDynamicLocation = z.infer<typeof insertDynamicLocationSchema>;

export type InsertWorkflowDefinition = z.infer<typeof insertWorkflowDefinitionSchema>;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;

export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;

// Country / Tenant types
export const insertCountrySchema = createInsertSchema(countries).omit({ countryId: true, createdAt: true });
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
