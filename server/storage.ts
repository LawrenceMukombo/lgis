import { db } from "./db";
import { eq, desc, asc, and, or, lt, gt, sql, isNull, inArray } from "drizzle-orm";
import {
  councils, councilUnits, users, roles, permissions, rolePermissions, userRoles,
  auditLogs, citizens, businesses, accounts, services, feeSchedules,
  serviceRequests, workflowDefinitions, workflowSteps, workflowInstances,
  inspections, inspectionFindings, inspectionEvidence,
  invoices, invoiceLines, payments, paymentAllocations,
  licences, licenceRenewals, properties, rateAssessments,
  markets, stalls, complaints, complaintUpdates, enforcementCases, notices, assets,
  licenseTypes, licenseTypeFees, checklistRequirements, specialRequirements,
  documents, businessVerificationRequests,
  locationLevels, locations, notifications,
  tenantConfig, dynamicLocations, integrationConfigs,
  type Council, type InsertCouncil,
  type Citizen, type InsertCitizen,
  type Business, type InsertBusiness,
  type Property,
  type ServiceRequest, type InsertServiceRequest,
  type Inspection, type InsertInspection,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type Licence, type InsertLicence,
  type Complaint, type InsertComplaint,
  type EnforcementCase,
  type AuditLog,
  type Service, type InsertService,
  type Market,
  type Stall,
  type User, type InsertUser,
  type Asset,
  type LicenseType, type InsertLicenseType,
  type LicenseTypeFee, type InsertLicenseTypeFee,
  type ChecklistRequirement, type InsertChecklistRequirement,
  type SpecialRequirement, type InsertSpecialRequirement,
  type Document, type InsertDocument,
  type BusinessVerificationRequest, type InsertBusinessVerificationRequest,
  type WorkflowDefinition, type WorkflowStep, type WorkflowInstance, type InsertWorkflowDefinition, type InsertWorkflowStep,
  type LocationLevel, type InsertLocationLevel,
  type Location, type InsertLocation,
  type Notification, type InsertNotification,
  type IntegrationConfig, type InsertIntegrationConfig,
  type InsertTenantConfig, type TenantConfig, type InsertDynamicLocation, type DynamicLocation,
  type InsertPurchaseOrder, type PurchaseOrder, type InsertPurchaseOrderLine, type PurchaseOrderLine,
  purchaseOrders, purchaseOrderLines
} from "@shared/schema";

export interface IStorage {
  // Tenant Configuration
  getTenantConfig(councilId: string): Promise<any>;
  updateTenantConfig(councilId: string, updates: any): Promise<any>;
  // Councils
  getCouncils(): Promise<Council[]>;
  getCouncilById(councilId: string): Promise<Council | undefined>;
  createCouncil(council: InsertCouncil): Promise<Council>;
  updateCouncil(councilId: string, council: Partial<InsertCouncil>): Promise<Council | undefined>;

  // Citizens
  getCitizens(councilId?: string): Promise<Citizen[]>;
  getCitizenById(citizenId: string): Promise<Citizen | undefined>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  updateCitizen(citizenId: string, updates: Partial<InsertCitizen>): Promise<Citizen | undefined>;

  // Businesses
  getBusinesses(councilId?: string): Promise<Business[]>;
  getBusinessById(businessId: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(businessId: string, updates: Partial<InsertBusiness>): Promise<Business | undefined>;

  // Properties
  getProperties(councilId?: string): Promise<Property[]>;
  getPropertyById(propertyId: string): Promise<Property | undefined>;
  createProperty(property: any): Promise<Property>;

  // Services
  getServices(councilId?: string): Promise<Service[]>;
  getServiceById(serviceId: string): Promise<Service | undefined>;
  createService(service: any): Promise<Service>;
  updateService(serviceId: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(serviceId: string): Promise<boolean>;

  // Service Requests
  getServiceRequests(councilId?: string): Promise<ServiceRequest[]>;
  getServiceRequestsByRequester(requesterId: string): Promise<ServiceRequest[]>;
  getServiceRequestById(requestId: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: any): Promise<ServiceRequest>;
  updateServiceRequestStatus(requestId: string, status: string, preprocessingData?: any, timestampUpdates?: any): Promise<ServiceRequest | undefined>;

  // Inspections
  getInspections(councilId?: string): Promise<Inspection[]>;
  getInspectionById(inspectionId: string): Promise<Inspection | undefined>;
  createInspection(inspection: any): Promise<Inspection>;
  updateInspection(inspectionId: string, updates: Partial<Inspection>): Promise<Inspection | undefined>;

  // Invoices
  getInvoices(councilId?: string): Promise<Invoice[]>;
  getInvoiceById(invoiceId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: any): Promise<Invoice>;

  // Dashboard
  getDashboardStats(councilId: string): Promise<{
    totalRevenue: number;
    activeLicenses: number;
    pendingInspections: number;
    citizenRequests: number;
    chartData: { name: string; total: number }[];
    districtData: { name: string; value: number }[];
  }>;

  // Payments
  getPayments(councilId?: string): Promise<Payment[]>;
  getPaymentById(paymentId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Licences
  getLicences(councilId?: string): Promise<Licence[]>;
  getLicenceByNo(licenceNo: string): Promise<Licence | undefined>;
  getLicenceById(licenceId: string): Promise<Licence | undefined>;
  getLicenceByRequestId(requestId: string): Promise<Licence | undefined>;
  createLicence(licence: any): Promise<Licence>;

  // Markets
  getMarkets(councilId?: string): Promise<Market[]>;
  createMarket(market: any): Promise<Market>;

  // Stalls
  getStalls(councilId?: string, marketId?: string): Promise<Stall[]>;
  createStall(stall: any): Promise<Stall>;

  // Complaints
  getComplaints(councilId?: string): Promise<Complaint[]>;
  getComplaintById(complaintId: string): Promise<Complaint | undefined>;
  createComplaint(complaint: any): Promise<Complaint>;

  // Enforcement Cases
  getEnforcementCases(councilId?: string): Promise<EnforcementCase[]>;
  createEnforcementCase(enforcementCase: any): Promise<EnforcementCase>;

  // Audit Logs
  getAuditLogs(councilId?: string): Promise<AuditLog[]>;
  createAuditLog(log: any): Promise<AuditLog>;

  // Users
  getUserById(userId: string): Promise<User | undefined>;
  getUserWithRole(userId: string): Promise<(User & { roleName: string }) | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Assets
  getAssets(councilId?: string): Promise<any[]>;
  getAssetById(assetId: string): Promise<any | undefined>;
  createAsset(asset: any): Promise<any>;
  updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset | undefined>;

  createLicenseType(data: InsertLicenseType): Promise<LicenseType>;
  getLicenseTypes(): Promise<LicenseType[]>;
  getLicenseTypeById(id: string): Promise<LicenseType | undefined>;

  // License Type Fees
  getLicenseTypeFees(): Promise<LicenseTypeFee[]>;
  createLicenseTypeFee(data: InsertLicenseTypeFee): Promise<LicenseTypeFee>;
  updateLicenseTypeFee(id: string, updates: Partial<InsertLicenseTypeFee>): Promise<LicenseTypeFee | undefined>;

  // Checklist Requirements
  getChecklistRequirements(licenseTypeId?: string): Promise<ChecklistRequirement[]>;
  createChecklistRequirement(data: InsertChecklistRequirement): Promise<ChecklistRequirement>;

  // Special Requirements
  getSpecialRequirements(licenseTypeId?: string): Promise<SpecialRequirement[]>;
  createSpecialRequirement(data: InsertSpecialRequirement): Promise<SpecialRequirement>;

  // Documents
  getDocumentsByOwner(ownerId: string): Promise<Document[]>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocumentStatus(documentId: string, status: string, rejectionReason?: string, verifiedBy?: string): Promise<Document | undefined>;
  deleteDocument(documentId: string): Promise<boolean>;

  // Business Verifications
  getBusinessVerificationByBusinessId(businessId: string): Promise<BusinessVerificationRequest | undefined>;
  createBusinessVerification(data: InsertBusinessVerificationRequest): Promise<BusinessVerificationRequest>;
  updateBusinessVerification(id: string, updates: Partial<InsertBusinessVerificationRequest>): Promise<BusinessVerificationRequest | undefined>;
  getPendingVerifications(): Promise<any[]>;

  // Workflows
  getWorkflowByService(serviceId: string): Promise<WorkflowDefinition | undefined>;
  getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]>;
  createWorkflowInstance(instance: any): Promise<WorkflowInstance>;
  createServiceRequestWithWorkflow(request: any, serviceId: string): Promise<{ request: ServiceRequest, workflow: WorkflowInstance }>;

  getWorkflowDefinitions(councilId: string): Promise<WorkflowDefinition[]>;
  getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | undefined>;
  createWorkflowDefinition(workflow: InsertWorkflowDefinition): Promise<WorkflowDefinition>;
  updateWorkflowDefinition(workflowId: string, updates: Partial<InsertWorkflowDefinition>): Promise<WorkflowDefinition | undefined>;

  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(stepId: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined>;
  deleteWorkflowStep(stepId: string): Promise<boolean>;
  getIntegrationConfigs(councilId: string): Promise<IntegrationConfig[]>;
  updateIntegrationConfig(configId: string, updates: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined>;

  // Procurement
  getPurchaseOrders(councilId?: string): Promise<PurchaseOrder[]>;
  getPurchaseOrderById(orderId: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(orderId: string, updates: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  createPurchaseOrderLine(line: InsertPurchaseOrderLine): Promise<PurchaseOrderLine>;
  getPurchaseOrderLines(orderId: string): Promise<PurchaseOrderLine[]>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: string): Promise<Notification | undefined>;

  // Locations
  getLocationLevels(councilId: string): Promise<LocationLevel[]>;
  createLocationLevel(level: any): Promise<LocationLevel>;
  getLocations(councilId: string, levelId?: string, parentId?: string): Promise<Location[]>;
  createLocation(location: any): Promise<Location>;
}

export class DatabaseStorage implements IStorage {
  // Tenant Configuration
  async getTenantConfig(councilId: string): Promise<any> {
    const [config] = await db.select().from(tenantConfig).where(eq(tenantConfig.councilId, councilId));
    return config;
  }

  async updateTenantConfig(councilId: string, updates: any): Promise<any> {
    const { configId, createdAt, updatedAt, ...cleanUpdates } = updates;
    const existing = await this.getTenantConfig(councilId);
    if (existing) {
      const [updated] = await db.update(tenantConfig)
        .set({ ...cleanUpdates, updatedAt: new Date() })
        .where(eq(tenantConfig.councilId, councilId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(tenantConfig)
        .values({ ...cleanUpdates, councilId })
        .returning();
      return created;
    }
  }

  // Councils
  async getCouncils(): Promise<Council[]> {
    return await db.select().from(councils).orderBy(desc(councils.createdAt));
  }

  async getCouncilById(councilId: string): Promise<Council | undefined> {
    const [council] = await db.select().from(councils).where(eq(councils.councilId, councilId));
    return council;
  }

  async createCouncil(council: InsertCouncil): Promise<Council> {
    const [created] = await db.insert(councils).values(council).returning();
    return created;
  }

  async updateCouncil(councilId: string, updates: Partial<InsertCouncil>): Promise<Council | undefined> {
    const [updated] = await db.update(councils).set(updates).where(eq(councils.councilId, councilId)).returning();
    return updated;
  }

  // Citizens
  async getCitizens(councilId?: string): Promise<Citizen[]> {
    if (councilId) return await db.select().from(citizens).where(eq(citizens.councilId, councilId));
    return await db.select().from(citizens);
  }

  async getCitizenById(citizenId: string): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.citizenId, citizenId));
    return citizen;
  }

  async createCitizen(citizen: InsertCitizen): Promise<Citizen> {
    const [created] = await db.insert(citizens).values(citizen).returning();
    return created;
  }

  async updateCitizen(citizenId: string, updates: Partial<InsertCitizen>): Promise<Citizen | undefined> {
    const [updated] = await db.update(citizens).set(updates).where(eq(citizens.citizenId, citizenId)).returning();
    return updated;
  }

  // Businesses
  async getBusinesses(councilId?: string): Promise<Business[]> {
    console.log(`[Storage] getBusinesses called for councilId: ${councilId || 'ALL'}`);
    if (councilId) return await db.select().from(businesses).where(eq(businesses.councilId, councilId));
    return await db.select().from(businesses);
  }

  async getBusinessById(businessId: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.businessId, businessId));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [created] = await db.insert(businesses).values(business).returning();
    return created;
  }

  async updateBusiness(businessId: string, updates: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [updated] = await db.update(businesses).set(updates).where(eq(businesses.businessId, businessId)).returning();
    return updated;
  }

  // Properties
  async getProperties(councilId?: string): Promise<Property[]> {
    if (councilId) return await db.select().from(properties).where(eq(properties.councilId, councilId));
    return await db.select().from(properties);
  }

  async getPropertyById(propertyId: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.propertyId, propertyId));
    return property;
  }

  async createProperty(property: any): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  // Services
  async getServices(councilId?: string): Promise<Service[]> {
    if (councilId) return await db.select().from(services).where(eq(services.councilId, councilId));
    return await db.select().from(services);
  }

  async getServiceById(serviceId: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.serviceId, serviceId));
    return service;
  }

  async createService(service: any): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(serviceId: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services).set(updates).where(eq(services.serviceId, serviceId)).returning();
    return updated;
  }

  async deleteService(serviceId: string): Promise<boolean> {
    const [updated] = await db.update(services).set({ active: false }).where(eq(services.serviceId, serviceId)).returning();
    return !!updated;
  }

  // Service Requests
  async getServiceRequests(councilId?: string): Promise<ServiceRequest[]> {
    if (councilId) return await db.select().from(serviceRequests).where(eq(serviceRequests.councilId, councilId));
    return await db.select().from(serviceRequests);
  }

  async getServiceRequestsByRequester(requesterId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).where(eq(serviceRequests.requesterId, requesterId));
  }

  async getServiceRequestById(requestId: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.requestId, requestId));
    return request;
  }

  async createServiceRequest(request: any): Promise<ServiceRequest> {
    const [created] = await db.insert(serviceRequests).values(request).returning();
    return created;
  }

  async updateServiceRequestStatus(requestId: string, status: string, preprocessingData?: any, timestampUpdates?: any): Promise<ServiceRequest | undefined> {
    const updateHeader: any = { status, ...timestampUpdates };
    if (preprocessingData) updateHeader.processingData = preprocessingData;
    const [updated] = await db.update(serviceRequests).set(updateHeader).where(eq(serviceRequests.requestId, requestId)).returning();
    return updated;
  }

  // Inspections
  async getDashboardStats(councilId: string) {
    // 1. Total Revenue (Sum of completed payments)
    const revenueResult = await db
      .select({
        total: sql<string>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.councilId, councilId),
          inArray(payments.status, ['completed', 'paid'])
        )
      );

    const totalRevenue = parseFloat(revenueResult[0]?.total || "0");

    // 2. Active Licenses
    const activeLicensesResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(licences)
      .where(
        and(
          eq(licences.councilId, councilId),
          inArray(licences.status, ['active', 'issued', 'approved'])
        )
      );

    const activeLicenses = Number(activeLicensesResult[0]?.count || 0);

    // 3. Pending Inspections
    const pendingInspectionsResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(inspections)
      .where(
        and(
          eq(inspections.councilId, councilId),
          isNull(inspections.performedAt)
        )
      );

    const pendingInspections = Number(pendingInspectionsResult[0]?.count || 0);

    // 4. Citizen Requests (Total)
    const requestsResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(serviceRequests)
      .where(eq(serviceRequests.councilId, councilId));

    const citizenRequests = Number(requestsResult[0]?.count || 0);

    // 5. Monthly Revenue (Last 6 months)
    // Note: Drizzle specific date functions can vary by DB driver. 
    // Assuming Postgres 'to_char' or just fetching all and grouping in JS for simplicity/compat
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPayments = await db
      .select({
        amount: payments.amount,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .where(
        and(
          eq(payments.councilId, councilId),
          inArray(payments.status, ['completed', 'paid']),
          gt(payments.paidAt, sixMonthsAgo)
        )
      );

    // Group by Month in JS
    const monthlyDataMap = new Map<string, number>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    recentPayments.forEach(p => {
      if (p.paidAt) {
        const d = new Date(p.paidAt);
        const monthKey = monthNames[d.getMonth()];
        const current = monthlyDataMap.get(monthKey) || 0;
        monthlyDataMap.set(monthKey, current + Number(p.amount));
      }
    });

    const chartData = Array.from(monthlyDataMap.entries()).map(([name, total]) => ({ name, total }));

    // 6. District Data (Businesses by District)
    const districtResult = await db
      .select({
        name: businesses.district,
        value: sql<number>`count(*)`
      })
      .from(businesses)
      .where(eq(businesses.councilId, councilId))
      .groupBy(businesses.district);

    /* 
    Fix: Filter only valid NCDC Electorates 
    Valid districts: Moresby North-East, Moresby North-West, Moresby South.
    */
    const validDistricts = ["Moresby North-East", "Moresby North-West", "Moresby South"];

    const districtData = districtResult
      .filter(d => d.name && validDistricts.includes(d.name))
      .map(d => ({
        name: d.name!,
        value: Number(d.value)
      }));

    // 7. Recent Activity (from Audit Logs for now, or mix of entities)
    // We'll fetch the last 5 relevant actions
    const recentActivityResult = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.councilId, councilId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5);

    const recentActivity = recentActivityResult.map(log => {
      let description = `Action: ${log.action} on ${log.entityType}`;
      let type = 'System Update';
      let amount = (log.details as any)?.amount || (log.details as any)?.total || 0;

      // Better mapping for Activity Feed
      if (log.entityType === 'licence') {
        type = 'License Issued';
        description = `New license #${log.entityId?.slice(0, 8)}... issued.`;
      } else if (log.entityType === 'payment') {
        type = 'Payment Received';
        description = `Payment of PGK ${amount} received.`;
      } else if (log.entityType === 'service_request') {
        type = 'Application Update';
        if (log.action === 'status_change') {
          const newState = (log.details as any)?.afterState || 'updated';
          description = `Application status updated to ${newState}.`;
        } else {
          description = `Application updated.`;
        }
      } else if (log.entityType === 'inspection') {
        type = 'Inspection Update';
        description = `Inspection record updated.`;
      } else if (log.entityType === 'document') {
        type = 'Document Review';
        if (log.action === 'review_document') {
          description = `Document reviewed by officer.`;
        }
      }

      return {
        id: log.auditId,
        type: type,
        entity: log.entityId,
        description: description,
        amount: amount,
        time: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()
      };
    });

    // 8. Critical Alerts
    // 8a. Expired Licenses
    const expiredLicenses = await db
      .select({
        name: businesses.legalName,
        expiry: licences.expiryDate
      })
      .from(licences)
      .innerJoin(serviceRequests, eq(licences.requestId, serviceRequests.requestId)) // Join to get requester (business)
      .innerJoin(businesses, eq(serviceRequests.requesterId, businesses.businessId))
      .where(
        and(
          eq(licences.councilId, councilId),
          lt(licences.expiryDate, new Date())
        )
      )
      .limit(3);

    const alerts = expiredLicenses.map(l => ({
      id: `exp-${l.name}`,
      type: 'License Expired',
      title: `License Expired: ${l.name}`,
      message: `${Math.floor((Date.now() - new Date(l.expiry!).getTime()) / (1000 * 60 * 60 * 24))} days overdue.`
    }));

    // 8b. Failed Inspections
    const failedInspections = await db
      .select({
        remarks: inspections.remarks,
        businessName: businesses.legalName
      })
      .from(inspections)
      .leftJoin(serviceRequests, eq(inspections.requestId, serviceRequests.requestId))
      .leftJoin(businesses, eq(serviceRequests.requesterId, businesses.businessId))
      .where(
        and(
          eq(inspections.councilId, councilId),
          eq(inspections.result, 'fail')
        )
      )
      .limit(3);

    failedInspections.forEach((i, idx) => {
      alerts.push({
        id: `fail-${idx}`,
        type: 'Health Violation',
        title: `Failed Inspection: ${i.businessName || 'Unknown Site'}`,
        message: i.remarks || "Immediate follow-up required."
      });
    });

    return {
      totalRevenue,
      activeLicenses,
      pendingInspections,
      citizenRequests,
      chartData,
      districtData,
      recentActivity,
      alerts
    };
  }

  async getInspections(councilId?: string): Promise<Inspection[]> {
    if (councilId) return await db.select().from(inspections).where(eq(inspections.councilId, councilId));
    return await db.select().from(inspections);
  }

  async getInspectionById(inspectionId: string): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.inspectionId, inspectionId));
    return inspection;
  }

  async createInspection(inspection: any): Promise<Inspection> {
    const [created] = await db.insert(inspections).values(inspection).returning();
    return created;
  }

  async updateInspection(inspectionId: string, updates: Partial<Inspection>): Promise<Inspection | undefined> {
    const [updated] = await db.update(inspections).set(updates).where(eq(inspections.inspectionId, inspectionId)).returning();
    return updated;
  }

  // Invoices
  async getInvoices(councilId?: string): Promise<Invoice[]> {
    if (councilId) return await db.select().from(invoices).where(eq(invoices.councilId, councilId));
    return await db.select().from(invoices);
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceId, invoiceId));
    return invoice;
  }

  async createInvoice(invoice: any): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  // Payments
  async getPayments(councilId?: string): Promise<Payment[]> {
    if (councilId) return await db.select().from(payments).where(eq(payments.councilId, councilId)).orderBy(desc(payments.createdAt));
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentById(paymentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.paymentId, paymentId));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  // Licences
  async getLicences(councilId?: string): Promise<Licence[]> {
    if (councilId) return await db.select().from(licences).where(eq(licences.councilId, councilId));
    return await db.select().from(licences);
  }

  async getLicenceByNo(licenceNo: string): Promise<Licence | undefined> {
    const [licence] = await db.select().from(licences).where(eq(licences.licenceNo, licenceNo));
    return licence;
  }

  async getLicenceById(licenceId: string): Promise<Licence | undefined> {
    const [licence] = await db.select().from(licences).where(eq(licences.licenceId, licenceId));
    return licence;
  }

  async getLicenceByRequestId(requestId: string): Promise<Licence | undefined> {
    const [licence] = await db.select().from(licences).where(eq(licences.requestId, requestId));
    return licence;
  }

  async createLicence(licence: any): Promise<Licence> {
    const [created] = await db.insert(licences).values(licence).returning();
    return created;
  }

  // Markets
  async getMarkets(councilId?: string): Promise<Market[]> {
    if (councilId) return await db.select().from(markets).where(eq(markets.councilId, councilId));
    return await db.select().from(markets);
  }

  async createMarket(market: any): Promise<Market> {
    const [created] = await db.insert(markets).values(market).returning();
    return created;
  }

  // Stalls
  async getStalls(councilId?: string, marketId?: string): Promise<Stall[]> {
    if (marketId) return await db.select().from(stalls).where(eq(stalls.marketId, marketId));
    if (councilId) return await db.select().from(stalls).where(eq(stalls.councilId, councilId));
    return await db.select().from(stalls);
  }

  async createStall(stall: any): Promise<Stall> {
    const [created] = await db.insert(stalls).values(stall).returning();
    return created;
  }

  // Complaints
  async getComplaints(councilId?: string): Promise<Complaint[]> {
    if (councilId) return await db.select().from(complaints).where(eq(complaints.councilId, councilId));
    return await db.select().from(complaints);
  }

  async getComplaintById(complaintId: string): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.complaintId, complaintId));
    return complaint;
  }

  async createComplaint(complaint: any): Promise<Complaint> {
    const [created] = await db.insert(complaints).values(complaint).returning();
    return created;
  }

  // Enforcement Cases
  async getEnforcementCases(councilId?: string): Promise<EnforcementCase[]> {
    if (councilId) return await db.select().from(enforcementCases).where(eq(enforcementCases.councilId, councilId));
    return await db.select().from(enforcementCases);
  }

  async createEnforcementCase(enforcementCase: any): Promise<EnforcementCase> {
    const [created] = await db.insert(enforcementCases).values(enforcementCase).returning();
    return created;
  }

  // Audit Logs
  async getAuditLogs(councilId?: string): Promise<AuditLog[]> {
    if (councilId) return await db.select().from(auditLogs).where(eq(auditLogs.councilId, councilId)).orderBy(desc(auditLogs.createdAt));
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  async createAuditLog(log: any): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // Users
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user;
  }

  async getUserWithRole(userId: string): Promise<(User & { roleName: string }) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    if (!user) return undefined;

    // Resolve the primary role name from the userRoles / roles junction
    const [userRole] = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
      .where(eq(userRoles.userId, userId))
      .limit(1);

    const roleName = userRole?.name?.toLowerCase() ?? user.role ?? "user";
    return { ...user, roleName };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  // Assets
  async getAssets(councilId?: string): Promise<Asset[]> {
    if (councilId) return await db.select().from(assets).where(eq(assets.councilId, councilId));
    return await db.select().from(assets);
  }

  async getAssetById(assetId: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId));
    return asset;
  }

  async createAsset(asset: any): Promise<Asset> {
    const [created] = await db.insert(assets).values(asset).returning();
    return created;
  }

  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets).set(updates).where(eq(assets.assetId, assetId)).returning();
    return updated;
  }

  // License Types
  async createLicenseType(data: InsertLicenseType): Promise<LicenseType> {
    const [created] = await db.insert(licenseTypes).values(data).returning();
    return created;
  }

  async getLicenseTypes(): Promise<LicenseType[]> {
    return await db.select().from(licenseTypes);
  }

  async getLicenseTypeById(id: string): Promise<LicenseType | undefined> {
    const [lt] = await db.select().from(licenseTypes).where(eq(licenseTypes.id, id));
    return lt;
  }

  async updateLicenseType(id: string, updates: Partial<InsertLicenseType>): Promise<LicenseType | undefined> {
    const [updated] = await db.update(licenseTypes).set(updates).where(eq(licenseTypes.id, id)).returning();
    return updated;
  }

  async deleteLicenseType(id: string): Promise<boolean> {
    // Also delete associated requirements
    await db.delete(checklistRequirements).where(eq(checklistRequirements.licenseTypeId, id));
    await db.delete(specialRequirements).where(eq(specialRequirements.licenseTypeId, id));
    await db.delete(licenseTypeFees).where(eq(licenseTypeFees.licenseTypeId, id));

    const [deleted] = await db.delete(licenseTypes).where(eq(licenseTypes.id, id)).returning();
    return !!deleted;
  }

  // License Type Fees
  async getLicenseTypeFees(): Promise<LicenseTypeFee[]> {
    return await db.select().from(licenseTypeFees);
  }

  async createLicenseTypeFee(data: InsertLicenseTypeFee): Promise<LicenseTypeFee> {
    const [created] = await db.insert(licenseTypeFees).values(data).returning();
    return created;
  }

  async updateLicenseTypeFee(id: string, updates: Partial<InsertLicenseTypeFee>): Promise<LicenseTypeFee | undefined> {
    const [updated] = await db.update(licenseTypeFees).set(updates).where(eq(licenseTypeFees.id, id)).returning();
    return updated;
  }

  // Checklist Requirements
  async getChecklistRequirements(licenseTypeId?: string): Promise<ChecklistRequirement[]> {
    if (licenseTypeId) return await db.select().from(checklistRequirements).where(eq(checklistRequirements.licenseTypeId, licenseTypeId));
    return await db.select().from(checklistRequirements);
  }

  async createChecklistRequirement(data: InsertChecklistRequirement): Promise<ChecklistRequirement> {
    const [created] = await db.insert(checklistRequirements).values(data).returning();
    return created;
  }

  async updateChecklistRequirement(id: string, updates: Partial<InsertChecklistRequirement>): Promise<ChecklistRequirement | undefined> {
    const [updated] = await db.update(checklistRequirements).set(updates).where(eq(checklistRequirements.id, id)).returning();
    return updated;
  }

  async deleteChecklistRequirement(id: string): Promise<boolean> {
    const [deleted] = await db.delete(checklistRequirements).where(eq(checklistRequirements.id, id)).returning();
    return !!deleted;
  }

  // Special Requirements
  async getSpecialRequirements(licenseTypeId?: string): Promise<SpecialRequirement[]> {
    if (licenseTypeId) return await db.select().from(specialRequirements).where(eq(specialRequirements.licenseTypeId, licenseTypeId));
    return await db.select().from(specialRequirements);
  }

  async createSpecialRequirement(data: InsertSpecialRequirement): Promise<SpecialRequirement> {
    const [created] = await db.insert(specialRequirements).values(data).returning();
    return created;
  }

  async updateSpecialRequirement(id: string, updates: Partial<InsertSpecialRequirement>): Promise<SpecialRequirement | undefined> {
    const [updated] = await db.update(specialRequirements).set(updates).where(eq(specialRequirements.id, id)).returning();
    return updated;
  }

  async deleteSpecialRequirement(id: string): Promise<boolean> {
    const [deleted] = await db.delete(specialRequirements).where(eq(specialRequirements.id, id)).returning();
    return !!deleted;
  }

  // Documents
  async getDocumentsByOwner(ownerId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.ownerId, ownerId));
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(data).returning();
    return created;
  }

  async updateDocumentStatus(documentId: string, status: string, rejectionReason?: string, verifiedBy?: string): Promise<Document | undefined> {
    const [updated] = await db.update(documents).set({
      status, rejectionReason, verified: status === 'approved',
      verifiedBy: status === 'approved' ? verifiedBy : null,
      verifiedAt: status === 'approved' ? new Date() : null
    }).where(eq(documents.documentId, documentId)).returning();
    return updated;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const [deleted] = await db.delete(documents).where(eq(documents.documentId, documentId)).returning();
    return !!deleted;
  }

  // Business Verifications
  async getBusinessVerificationByBusinessId(businessId: string): Promise<BusinessVerificationRequest | undefined> {
    const [request] = await db.select().from(businessVerificationRequests).where(eq(businessVerificationRequests.businessId, businessId));
    return request;
  }

  async createBusinessVerification(data: InsertBusinessVerificationRequest): Promise<BusinessVerificationRequest> {
    const [created] = await db.insert(businessVerificationRequests).values(data).returning();
    return created;
  }

  async updateBusinessVerification(id: string, updates: Partial<InsertBusinessVerificationRequest>): Promise<BusinessVerificationRequest | undefined> {
    const [updated] = await db.update(businessVerificationRequests).set(updates).where(eq(businessVerificationRequests.requestId, id)).returning();
    return updated;
  }

  async getPendingVerifications(): Promise<any[]> {
    const requests = await db.select({
      requestId: businessVerificationRequests.requestId,
      businessId: businesses.businessId,
      businessName: businesses.legalName,
      registrationNo: businesses.registrationNo,
      submittedAt: businessVerificationRequests.submittedAt,
      status: businessVerificationRequests.status,
    }).from(businessVerificationRequests)
      .innerJoin(businesses, eq(businessVerificationRequests.businessId, businesses.businessId))
      .where(eq(businessVerificationRequests.status, 'pending'));
    const result = [];
    for (const req of requests) {
      const docs = await db.select().from(documents).where(eq(documents.ownerId, req.businessId));
      result.push({ ...req, documentCount: docs.length });
    }
    return result;
  }

  // Workflows
  async getWorkflowByService(serviceId: string): Promise<WorkflowDefinition | undefined> {
    const [workflow] = await db.select().from(workflowDefinitions).where(eq(workflowDefinitions.serviceId, serviceId));
    return workflow;
  }

  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await db.select().from(workflowSteps).where(eq(workflowSteps.workflowId, workflowId)).orderBy(asc(workflowSteps.orderNo));
  }

  async createWorkflowInstance(instance: any): Promise<WorkflowInstance> {
    const [created] = await db.insert(workflowInstances).values(instance).returning();
    return created;
  }

  async createServiceRequestWithWorkflow(request: any, serviceId: string): Promise<{ request: ServiceRequest, workflow: WorkflowInstance }> {
    const [createdRequest] = await db.insert(serviceRequests).values(request).returning();
    let workflow = await this.getWorkflowByService(serviceId);
    if (!workflow) {
      const [newWorkflow] = await db.insert(workflowDefinitions).values({ councilId: request.councilId, serviceId, version: "1.0", active: true }).returning();
      workflow = newWorkflow;
      await db.insert(workflowSteps).values([
        { councilId: request.councilId, workflowId: workflow.workflowId, name: "Submission Review", orderNo: 1, assigneeRole: "Officer" },
        { councilId: request.councilId, workflowId: workflow.workflowId, name: "Inspection", orderNo: 2, assigneeRole: "Inspector" },
        { councilId: request.councilId, workflowId: workflow.workflowId, name: "Approval", orderNo: 3, assigneeRole: "Manager" },
        { councilId: request.councilId, workflowId: workflow.workflowId, name: "Issuance", orderNo: 4, assigneeRole: "Admin" }
      ]);
    }
    const steps = await this.getWorkflowSteps(workflow.workflowId);
    const [instance] = await db.insert(workflowInstances).values({
      councilId: request.councilId, requestId: createdRequest.requestId, workflowId: workflow.workflowId,
      state: "active", currentStepId: steps[0]?.stepId, startedAt: new Date()
    }).returning();
    return { request: createdRequest, workflow: instance };
  }

  async getWorkflowDefinitions(councilId: string): Promise<WorkflowDefinition[]> {
    let workflows = await db.select().from(workflowDefinitions).where(eq(workflowDefinitions.councilId, councilId));
    if (workflows.length === 0) {
      const seeds = [
        { councilId, serviceId: "seed-licensing", name: "Business License Approval", description: "Standard process for new business registrations.", version: "1.0", active: true },
        { councilId, serviceId: "seed-building", name: "Building Permit Review", description: "Technical review for construction permits.", version: "1.0", active: true },
        { councilId, serviceId: "seed-complaint", name: "Citizen Complaint Handling", description: "Routing and resolution of public issues.", version: "1.0", active: false }
      ];
      const [w1, w2, w3] = await db.insert(workflowDefinitions).values(seeds).returning();
      workflows = [w1, w2, w3];
      await db.insert(workflowSteps).values([
        { councilId, workflowId: w1.workflowId, name: "Application", orderNo: 1, assigneeRole: "Officer" },
        { councilId, workflowId: w1.workflowId, name: "Document Check", orderNo: 2, assigneeRole: "Officer" },
        { councilId, workflowId: w1.workflowId, name: "Site Inspection", orderNo: 3, assigneeRole: "Inspector" },
        { councilId, workflowId: w1.workflowId, name: "Approval", orderNo: 4, assigneeRole: "Manager" }
      ]);
    }
    return workflows;
  }

  async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | undefined> {
    const [workflow] = await db.select().from(workflowDefinitions).where(eq(workflowDefinitions.workflowId, workflowId));
    return workflow;
  }

  async createWorkflowDefinition(workflow: InsertWorkflowDefinition): Promise<WorkflowDefinition> {
    const [created] = await db.insert(workflowDefinitions).values(workflow).returning();
    return created;
  }

  async updateWorkflowDefinition(workflowId: string, updates: Partial<InsertWorkflowDefinition>): Promise<WorkflowDefinition | undefined> {
    const [updated] = await db.update(workflowDefinitions).set(updates).where(eq(workflowDefinitions.workflowId, workflowId)).returning();
    return updated;
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const [created] = await db.insert(workflowSteps).values(step).returning();
    return created;
  }

  async updateWorkflowStep(stepId: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined> {
    const [updated] = await db.update(workflowSteps).set(updates).where(eq(workflowSteps.stepId, stepId)).returning();
    return updated;
  }

  async deleteWorkflowStep(stepId: string): Promise<boolean> {
    const [deleted] = await db.delete(workflowSteps).where(eq(workflowSteps.stepId, stepId)).returning();
    return !!deleted;
  }

  async getIntegrationConfigs(councilId: string): Promise<IntegrationConfig[]> {
    let configs = await db.select().from(integrationConfigs).where(eq(integrationConfigs.councilId, councilId));
    if (configs.length === 0) {
      const seeds = [
        { councilId, name: "National ID System (NID)", type: "Identity Provider", status: "Connected", description: "Verifies citizen identities against national database." },
        { councilId, name: "IPA Business Registry", type: "Business Registry", status: "Connected", description: "Syncs business registration details from IPA." },
        { councilId, name: "IFMIS / Treasury", type: "Financial System", status: "Error", description: "Financial reporting and reconciliation with Treasury." },
        { councilId, name: "IRC Tax Systems", type: "Tax Authority", status: "Disconnected", description: "Tax Identification Number (TIN) validation." },
        { councilId, name: "Bank of South Pacific (BSP)", type: "Payment Gateway", status: "Connected", description: "Online payment processing." }
      ];
      configs = await db.insert(integrationConfigs).values(seeds).returning();
    }
    return configs;
  }

  async updateIntegrationConfig(configId: string, updates: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined> {
    const [updated] = await db.update(integrationConfigs).set(updates).where(eq(integrationConfigs.configId, configId)).returning();
    return updated;
  }

  // Procurement
  async getPurchaseOrders(councilId?: string): Promise<PurchaseOrder[]> {
    if (councilId) return await db.select().from(purchaseOrders).where(eq(purchaseOrders.councilId, councilId)).orderBy(desc(purchaseOrders.createdAt));
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrderById(orderId: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, orderId));
    return order;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [created] = await db.insert(purchaseOrders).values(order).returning();
    return created;
  }

  async updatePurchaseOrder(orderId: string, updates: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.orderId, orderId)).returning();
    return updated;
  }

  async createPurchaseOrderLine(line: InsertPurchaseOrderLine): Promise<PurchaseOrderLine> {
    const [created] = await db.insert(purchaseOrderLines).values(line).returning();
    return created;
  }

  async getPurchaseOrderLines(orderId: string): Promise<PurchaseOrderLine[]> {
    return await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.orderId, orderId));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(notificationId: string): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ read: true }).where(eq(notifications.notificationId, notificationId)).returning();
    return updated;
  }

  // Locations
  async getLocationLevels(councilId: string): Promise<LocationLevel[]> {
    return await db.select().from(locationLevels).where(eq(locationLevels.councilId, councilId)).orderBy(locationLevels.level);
  }

  async createLocationLevel(level: any): Promise<LocationLevel> {
    const [created] = await db.insert(locationLevels).values(level).returning();
    return created;
  }

  async getLocations(councilId: string, levelId?: string, parentId?: string): Promise<Location[]> {
    let query: any = db.select().from(locations).where(eq(locations.councilId, councilId));
    if (levelId) query = query.where(eq(locations.levelId, levelId));
    if (parentId) query = query.where(eq(locations.parentId, parentId));
    return await query;
  }

  async createLocation(location: any): Promise<Location> {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
