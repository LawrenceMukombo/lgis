import type { Express, Request, Response } from "express";
import { isAuthenticated, requireRole } from "./middleware";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { DigitalSignatureService } from "./digital_signature_service";
import { PdfService } from "./pdf_service";
import { db } from "./db";
import { PaymentGateway } from "./payment_gateway";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import {
  serviceRequests, users,
  insertCouncilSchema, insertCitizenSchema, insertBusinessSchema,
  insertPropertySchema, insertServiceSchema, insertServiceRequestSchema,
  insertInspectionSchema, insertInvoiceSchema, insertPaymentSchema,
  insertLicenceSchema, insertMarketSchema, insertStallSchema,
  insertComplaintSchema, insertEnforcementCaseSchema, insertNoticeSchema,
  insertAuditLogSchema, insertAssetSchema,
  insertPurchaseOrderSchema, insertPurchaseOrderLineSchema,

  insertLicenseTypeSchema, insertChecklistRequirementSchema, insertSpecialRequirementSchema,
  insertDocumentSchema, insertNotificationSchema, insertWorkflowDefinitionSchema, insertWorkflowStepSchema,
  insertLicenseTypeFeeSchema
} from "@shared/schema";
import { sendEmail, getStatusChangeEmailContent } from "./email";
import { addUserManagementRoutes } from "./user_management_routes";
import { registerFieldPolicyRoutes } from "./field_policy_routes";
import { countryScope, requireSuperAdmin } from "./country-middleware";

async function logAudit(
  councilId: string,
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | undefined,
  beforeState?: any,
  afterState?: any,
  ipAddress?: string
) {
  try {
    await storage.createAuditLog({
      councilId,
      userId,
      action,
      entityType,
      entityId,
      beforeState,
      afterState,
      ipAddress: ipAddress || "system",
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

import { setupAuth } from "./auth";

import multer from "multer";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Document Uploads
  app.get("/api/login", (_req, res) => {
    res.status(200).json({
      message: "Server Connection Successful! Please use the LGIS Mobile App to log in.",
      ip: _req.ip
    });
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "LGIS Server Online" });
  });

  // ============================================================
  // COUNTRY (TENANT) MANAGEMENT — System Administrators only
  // ============================================================
  app.get("/api/countries", isAuthenticated, async (_req, res) => {
    try {
      const list = await storage.getCountries();
      res.json(list);
    } catch (err) {
      console.error("[countries] GET error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch countries" });
    }
  });

  app.get("/api/countries/:countryId", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const c = await storage.getCountryById(req.params.countryId);
      if (!c) return res.status(404).json({ success: false, message: "Country not found" });
      res.json(c);
    } catch (err) {
      console.error("[countries] GET/:id error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch country" });
    }
  });

  app.post("/api/countries", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const created = await storage.createCountry(req.body);
      res.status(201).json(created);
    } catch (err) {
      console.error("[countries] POST error:", err);
      res.status(500).json({ success: false, message: "Failed to create country" });
    }
  });

  app.patch("/api/countries/:countryId", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const updated = await storage.updateCountry(req.params.countryId, req.body);
      if (!updated) return res.status(404).json({ success: false, message: "Country not found" });
      res.json(updated);
    } catch (err) {
      console.error("[countries] PATCH error:", err);
      res.status(500).json({ success: false, message: "Failed to update country" });
    }
  });

  app.post("/api/v1/uploads", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }
      const fileData = {
        councilId: "ncdc-council-id", // TODO: Extract from auth context
        entityType: "request", // Default
        entityId: "temp-id",
        documentType: "supporting_doc",
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        status: "pending",
        uploadedBy: "system_user" // TODO: Extract from auth context
      };
      // For now just return the file info, actual DB storage for documents is handled in specific endpoints
      res.json(fileData);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).send("Upload failed");
    }
  });

  // Get Service Requests (RBAC: Admin/Staff see all, Citizens see own)
  app.get("/api/v1/service-requests", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector"].includes(user.role);
      const requests = await storage.getServiceRequests();

      if (isAdminOrStaff) {
        res.json(requests);
      } else {
        // Filter for citizens
        const myRequests = requests.filter(r => r.requesterId === user.userId || r.submittedBy === user.userId);
        res.json(myRequests);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service requests" });
    }
  });

  // Get Businesses for GIS (Public read-only access, enhanced for authenticated users)
  app.get("/api/v1/businesses", async (req, res) => {
    try {
      const user = req.user as any;
      const isAuthenticated = !!user;
      const isAdminOrStaff = isAuthenticated && ["admin", "manager", "officer", "inspector", "accountant", "sysadmin"].includes(user?.role || '');

      console.log(`[API] GET /businesses - Auth: ${isAuthenticated}, Role: ${user?.role || 'none'}, IsStaff: ${isAdminOrStaff}`);

      let businesses;
      try {
        businesses = await storage.getBusinesses();
      } catch (storageError: any) {
        console.error("[API] STORAGE ERROR in /businesses:", storageError);
        return res.status(500).json({ error: "Storage Error", details: storageError.message });
      }

      if (!Array.isArray(businesses)) {
        console.error("[API] Critical: Businesses is not an array:", businesses);
        return res.status(500).json({ error: "Invalid Data Format from Storage" });
      }

      // Filter based on authentication
      if (isAuthenticated && !isAdminOrStaff) {
        // Authenticated non-staff users see only their own businesses
        businesses = businesses.filter((b: any) => b.ownerUserId === user.userId);
      }
      // Public users and staff see all businesses (public sees limited fields, handled by client)

      console.log(`[API] Returning ${businesses.length} businesses`);
      res.json(businesses);
    } catch (error: any) {
      console.error("[API] GET /businesses Critical Error:", error);
      res.status(500).json({ error: "Failed to fetch businesses", details: error.message });
    }
  });

  // Get Single Business by ID (Public read-only access)
  app.get("/api/v1/businesses/:id", async (req, res) => {
    try {
      const businessId = req.params.id;
      console.log(`[API] GET /businesses/${businessId}`);

      const business = await storage.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json(business);
    } catch (error: any) {
      console.error(`[API] GET /businesses/:id Error:`, error);
      res.status(500).json({ error: "Failed to fetch business", details: error.message });
    }
  });

  // Update Business by ID
  app.patch("/api/v1/businesses/:id", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.params.id;
      const user = req.user as any;

      console.log(`[API] PATCH /businesses/${businessId} by user ${user?.email}`);

      const business = await storage.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      // Authorization: Only owner or admin/staff can edit
      const isAdminOrStaff = ["admin", "manager", "officer", "sysadmin"].includes(user?.role || '');
      const isOwner = business.ownerUserId === user.userId;

      if (!isAdminOrStaff && !isOwner) {
        return res.status(403).json({ error: "Not authorized to edit this business" });
      }

      const updated = await storage.updateBusiness(businessId, req.body);

      if (updated) {
        await logAudit(business.councilId, user.userId, "update", "business", businessId, business, updated);
      }

      res.json(updated);
    } catch (error: any) {
      console.error(`[API] PATCH /businesses/:id Error:`, error);
      res.status(500).json({ error: "Failed to update business", details: error.message });
    }
  });



  // Get Documents for Request
  app.get("/api/v1/requests/:id/documents", async (req, res) => {
    try {
      const docs = await storage.getDocumentsByOwner(req.params.id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      console.error("Error Details:", (error as any).message); // Log message directly
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get Documents for Business
  app.get("/api/v1/businesses/:id/documents", async (req, res) => {
    try {
      const docs = await storage.getDocumentsByOwner(req.params.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business documents" });
    }
  });



  // Review Document (RBAC: Officer/Manager/Admin only)
  app.patch("/api/v1/documents/:id/review", requireRole(["officer", "manager", "admin"]), async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const documentId = req.params.id;

      // Update Document Status
      const document = await storage.updateDocumentStatus(
        documentId,
        status,
        rejectionReason,
        (req.user as any)?.userId || 'system'
      );

      if (!document) return res.status(404).json({ error: "Document not found" });

      // Audit Log
      await logAudit(
        document.councilId,
        (req.user as any)?.userId,
        "review_document",
        "document",
        documentId,
        { status: 'pending' },
        { status, rejectionReason }
      );

      // Identify Owner and Notify
      try {
        let recipientEmail: string | undefined;
        let recipientUserId: string | undefined;
        let recipientName: string = "Applicant";

        // Logic to find the recipient based on ownerType
        if (document.ownerType === 'service_request') {
          const request = await storage.getServiceRequestById(document.ownerId);
          if (request) {
            if (request.requesterType === 'business') {
              const business = await storage.getBusinessById(request.requesterId);
              if (business) {
                recipientEmail = business.contactEmail ?? undefined;
                recipientUserId = business.ownerUserId ?? undefined;
                recipientName = business.legalName;
              }
            } else if (request.requesterType === 'citizen') {
              const citizen = await storage.getCitizenById(request.requesterId);
              if (citizen) {
                recipientEmail = citizen.email ?? undefined;
                recipientName = `${citizen.firstName} ${citizen.lastName}`;
                // Citizens might not have user accounts yet, check if one exists via email?
                // For now, only notify if we have a linked user ID strategy, creating "portal users" might be separate.
              }
            }
          }
        } else if (document.ownerType === 'business') {
          const business = await storage.getBusinessById(document.ownerId);
          if (business) {
            recipientEmail = business.contactEmail ?? undefined;
            recipientUserId = business.ownerUserId ?? undefined;
            recipientName = business.legalName;
          }
        }

        // 1. Create In-App Notification (if we have a UserId)
        if (recipientUserId) {
          await storage.createNotification({
            councilId: document.councilId,
            userId: recipientUserId,
            type: status === 'approved' ? 'success' : 'warning',
            title: `Document ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your document "${document.fileName}" has been ${status}.${status === 'rejected' ? ` Reason: ${rejectionReason}` : ''}`,
            referenceType: 'document',
            referenceId: document.documentId,
            read: false,
          });
        }

        // 2. Send Email
        if (recipientEmail) {
          console.log(`[Email] Sending ${status} notification to ${recipientEmail}`);
          try {
            const { getDocumentReviewEmailContent } = await import('./email');
            const emailContent = getDocumentReviewEmailContent(document.fileName, status as 'approved' | 'rejected', rejectionReason);
            const { sendEmail } = await import('./email');
            await sendEmail({
              to: recipientEmail,
              subject: emailContent.subject,
              text: emailContent.text,
              html: emailContent.html
            });
            console.log(`[Email] Successfully sent to ${recipientEmail}`);
          } catch (emailError) {
            console.error(`[Email] Failed to send:`, emailError);
            // Don't fail the request if email fails
          }
        }

      } catch (notifyError) {
        console.error("Notification failed:", notifyError);
        // Don't fail the request if notification fails
      }

      res.json(document);
    } catch (error) {
      console.error("Document review error:", error);
      res.status(500).json({ error: "Failed to review document" });
    }
  });

  // Delete Document (RBAC: Admin only)
  app.delete("/api/v1/documents/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const documentId = req.params.id;
      console.log(`[API] Received DELETE request for document: ${documentId}`);
      // In a real app, check ownership/permissions here
      const success = await storage.deleteDocument(documentId);
      console.log(`[API] Delete result for ${documentId}: ${success}`);
      if (!success) return res.status(404).json({ error: "Document not found" });

      // Audit Log
      await logAudit(
        (req.user as any)?.councilId || 'system',
        (req.user as any)?.userId,
        "delete_document",
        "document",
        documentId,
        { status: 'deleted' }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Notifications
  app.get("/api/v1/notifications", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "User ID required" });
      const notes = await storage.getNotifications(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Set up authentication routes and session middleware
  setupAuth(app);

  // Apply country (tenant) scoping to all authenticated API routes
  app.use("/api", countryScope);

  // Register Field Policy Routes
  registerFieldPolicyRoutes(app);

  // Business Registration Route
  app.post("/api/v1/businesses/register", upload.array("documents"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const fileData = req.files as Express.Multer.File[];
      const businessData = JSON.parse(req.body.data);

      // Create Business
      const business = await storage.createBusiness({
        ...businessData,
        ownerUserId: (req.user as any).userId,
        status: "pending_verification",
        councilId: businessData.councilId // Ensure this is validated/sanitized
      });

      // Process and Save Documents
      if (fileData && fileData.length > 0) {
        for (const file of fileData) {
          await storage.createDocument({
            councilId: business.councilId,
            ownerType: "business",
            ownerId: business.businessId,
            type: "registration_doc", // This should ideally be passed from frontend metadata
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            verified: false
          });
        }
      }

      // Create Verification Request
      await storage.createBusinessVerification({
        businessId: business.businessId,
        councilId: business.councilId,
        status: "pending",
      });

      res.status(201).json(business);
    } catch (error: any) {
      console.error("Business Registration Error:", error);
      res.status(500).json({ error: error.message || "Failed to register business" });
    }
  });

  // Business Verification Routes
  app.get("/api/v1/verifications/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      // In a real app, join with businesses table to get names
      // For now, fetching verifications and enriching manually or expecting enhanced storage method
      // Assuming storage.getPendingVerifications() exists or we construct a query

      const result = await storage.getPendingVerifications(); // Need to implement this in storage
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  app.post("/api/v1/verifications/:id/verify", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { status, comments } = req.body;
      const verification = await storage.updateBusinessVerification(req.params.id, {
        status,
        reviewedBy: (req.user as any).userId,
        reviewedAt: new Date(),
        comments
      });

      if (verification && status === 'approved') {
        await storage.updateBusiness(verification.businessId, { status: 'verified' });
      } else if (verification && status === 'rejected') {
        await storage.updateBusiness(verification.businessId, { status: 'rejected' });
      }

      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update verification" });
    }
  });

  // ================================
  // WORKFLOWS & INTEGRATIONS
  // ================================
  app.get("/api/v1/workflow-definitions", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      if (!councilId) return res.status(400).json({ error: "Council ID required" });
      const workflows = await storage.getWorkflowDefinitions(councilId);

      const enriched = await Promise.all(workflows.map(async wf => {
        const steps = await storage.getWorkflowSteps(wf.workflowId);
        return { ...wf, steps: steps.map(s => s.name) };
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/v1/workflow-definitions", async (req, res) => {
    try {
      const data = insertWorkflowDefinitionSchema.parse(req.body);
      const workflow = await storage.createWorkflowDefinition(data);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow data" });
    }
  });

  app.get("/api/v1/workflow-definitions/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflowDefinition(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });

      const steps = await storage.getWorkflowSteps(workflow.workflowId);
      res.json({ ...workflow, steps });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.patch("/api/v1/workflow-definitions/:id", async (req, res) => {
    try {
      const updates = insertWorkflowDefinitionSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflowDefinition(req.params.id, updates);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid updates" });
    }
  });

  app.post("/api/v1/workflow-steps", async (req, res) => {
    try {
      const data = insertWorkflowStepSchema.parse(req.body);
      const step = await storage.createWorkflowStep(data);
      res.status(201).json(step);
    } catch (error) {
      res.status(400).json({ error: "Invalid step data" });
    }
  });

  app.patch("/api/v1/workflow-steps/:id", async (req, res) => {
    try {
      const updates = insertWorkflowStepSchema.partial().parse(req.body);
      const step = await storage.updateWorkflowStep(req.params.id, updates);
      if (!step) return res.status(404).json({ error: "Step not found" });
      res.json(step);
    } catch (error) {
      res.status(400).json({ error: "Invalid updates" });
    }
  });

  app.delete("/api/v1/workflow-steps/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflowStep(req.params.id);
      if (!success) return res.status(404).json({ error: "Step not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete step" });
    }
  });

  /**
   * @swagger
   * /api/v1/integrations:
   *   get:
   *     summary: Retrieve system integrations
   *     tags: [Integrations]
   *     parameters:
   *       - in: query
   *         name: councilId
   *         schema:
   *           type: string
   *         required: true
   *         description: The Council ID
   *     responses:
   *       200:
   *         description: A list of integration configurations
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   configId:
   *                     type: string
   *                   name:
   *                     type: string
   *                   status:
   *                     type: string
   */
  app.get("/api/v1/integrations", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      if (!councilId) return res.status(400).json({ error: "Council ID required" });
      const integrations = await storage.getIntegrationConfigs(councilId);
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/v1/integrations/:id/sync", async (req, res) => {
    try {
      // Simulate sync latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updated = await storage.updateIntegrationConfig(req.params.id, {
        lastSyncAt: new Date(),
        status: 'Connected' // Force success for demo
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // ================================
  // LOCATIONS
  // ================================
  app.get("/api/v1/location-levels", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      if (!councilId) return res.status(400).json({ error: "Council ID required" });
      const levels = await storage.getLocationLevels(councilId);
      res.json(levels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location levels" });
    }
  });

  app.get("/api/v1/locations", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      if (!councilId) return res.status(400).json({ error: "Council ID required" });
      const { levelId, parentId } = req.query;
      const data = await storage.getLocations(councilId, levelId as string, parentId as string);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // ================================
  // COUNCILS
  // ================================
  app.get("/api/v1/councils", async (req, res) => {
    try {
      const data = await storage.getCouncils();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch councils" });
    }
  });

  app.get("/api/v1/councils/:councilId", async (req, res) => {
    try {
      const council = await storage.getCouncilById(req.params.councilId);
      if (!council) {
        return res.status(404).json({ error: "Council not found" });
      }
      res.json(council);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch council" });
    }
  });

  app.post("/api/v1/councils", async (req, res) => {
    try {
      const data = insertCouncilSchema.parse(req.body);
      const council = await storage.createCouncil(data);
      res.status(201).json(council);
    } catch (error) {
      res.status(400).json({ error: "Invalid council data" });
    }
  });

  app.put("/api/v1/councils/:councilId", async (req, res) => {
    try {
      // Allow partial updates
      const data = insertCouncilSchema.partial().parse(req.body);
      const updated = await storage.updateCouncil(req.params.councilId, data);

      if (!updated) {
        return res.status(404).json({ error: "Council not found" });
      }

      await logAudit(
        req.params.councilId,
        (req as any).user?.userId, // Assuming user is attached to req
        "UPDATE",
        "COUNCIL",
        req.params.councilId,
        undefined,
        data
      );

      res.json(updated);
    } catch (error) {
      console.error("Update council error:", error);
      res.status(400).json({ error: "Invalid council data" });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.get("/api/organizations", async (req, res) => {
    try {
      const councils = await storage.getCouncils();
      const orgs = councils.map(c => ({
        id: c.councilId,
        name: c.name,
        type: c.level,
        status: c.status,
        createdAt: c.createdAt
      }));
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Legacy councils endpoint for frontend compatibility
  app.get("/api/councils", async (req, res) => {
    try {
      const data = await storage.getCouncils();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch councils" });
    }
  });

  // ================================
  // CITIZENS
  // ================================
  app.get("/api/v1/citizens", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getCitizens(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citizens" });
    }
  });

  app.get("/api/v1/citizens/:citizenId", async (req, res) => {
    try {
      const citizen = await storage.getCitizenById(req.params.citizenId);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }
      res.json(citizen);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citizen" });
    }
  });

  app.post("/api/v1/citizens", async (req, res) => {
    try {
      const data = insertCitizenSchema.parse(req.body);
      const citizen = await storage.createCitizen(data);
      await logAudit(data.councilId, undefined, "create", "citizen", citizen.citizenId, null, citizen);
      res.status(201).json(citizen);
    } catch (error) {
      console.error("Create citizen error:", error);
      res.status(400).json({ error: "Invalid citizen data" });
    }
  });

  // Legacy endpoint - returns new schema format for updated frontend
  app.get("/api/citizens", async (req, res) => {
    try {
      console.log("[API] GET /citizens - Start");
      const councilId = req.query.organizationId as string || req.query.councilId as string;
      const citizens = await storage.getCitizens(councilId);
      console.log(`[API] Returning ${citizens?.length || 0} citizens`);
      res.json(citizens || []);
    } catch (error: any) {
      console.error("[API] GET /citizens Error:", error);
      res.status(500).json({ error: "Failed to fetch citizens", details: error.message });
    }
  });

  app.post("/api/citizens", async (req, res) => {
    try {
      const { organizationId, fullName, nidNumber, ...rest } = req.body;
      const names = (fullName || "").split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";
      const data = {
        councilId: organizationId,
        firstName,
        lastName,
        nationalId: nidNumber,
        ...rest
      };
      const citizen = await storage.createCitizen(data);
      res.status(201).json({
        id: citizen.citizenId,
        fullName: `${citizen.firstName} ${citizen.lastName}`,
        ...citizen
      });
    } catch (error) {
      console.error("Create citizen error:", error);
      res.status(400).json({ error: "Invalid citizen data" });
    }
  });

  app.patch("/api/citizens/:citizenId", async (req, res) => {
    try {
      const { citizenId } = req.params;
      const existing = await storage.getCitizenById(citizenId);
      if (!existing) {
        return res.status(404).json({ error: "Citizen not found" });
      }
      const updated = await storage.updateCitizen(citizenId, req.body);
      if (updated) {
        await logAudit(existing.councilId, undefined, "update", "citizen", citizenId, existing, updated);
      }
      res.json(updated);
    } catch (error) {
      console.error("Update citizen error:", error);
      res.status(400).json({ error: "Failed to update citizen" });
    }
  });

  // ================================
  // BUSINESSES
  // ================================
  app.get("/api/v1/businesses", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getBusinesses(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.get("/api/v1/businesses/:businessId", async (req, res) => {
    try {
      const business = await storage.getBusinessById(req.params.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  app.post("/api/v1/businesses", async (req, res) => {
    try {
      const data = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(data);
      await logAudit(data.councilId, undefined, "create", "business", business.businessId, null, business);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ error: "Invalid business data" });
    }
  });

  // Legacy endpoint - returns new schema format for updated frontend
  app.get("/api/businesses", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string || req.query.councilId as string;
      const businesses = await storage.getBusinesses(councilId);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.get("/api/v1/debug/businesses", async (req, res) => {
    const all = await storage.getBusinesses();
    res.json(all);
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      const { organizationId, businessName, tradingAs, tinNumber, registrationNumber, ...rest } = req.body;
      const data = {
        councilId: organizationId,
        legalName: businessName,
        tradingName: tradingAs,
        tin: tinNumber,
        registrationNo: registrationNumber,
        ...rest
      };
      const business = await storage.createBusiness(data);
      res.status(201).json({
        id: business.businessId,
        businessName: business.legalName,
        ...business
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid business data" });
    }
  });

  app.patch("/api/businesses/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      const existing = await storage.getBusinessById(businessId);
      if (!existing) {
        return res.status(404).json({ error: "Business not found" });
      }
      const updated = await storage.updateBusiness(businessId, req.body);
      if (updated) {
        await logAudit(existing.councilId, undefined, "update", "business", businessId, existing, updated);
      }
      res.json(updated);
    } catch (error) {
      console.error("Update business error:", error);
      res.status(400).json({ error: "Failed to update business" });
    }
  });

  // Business Registration with file uploads
  app.post("/api/v1/businesses/register", upload.array("documents", 10), async (req, res) => {
    try {
      // Parse the business data from the form
      const businessData = JSON.parse(req.body.data);

      // Validate the business data
      const validatedData = insertBusinessSchema.parse(businessData);

      // Create the business
      const business = await storage.createBusiness(validatedData);

      // Handle file uploads if any
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const docData = {
            councilId: businessData.councilId,
            ownerType: "business",
            ownerId: business.businessId,
            type: "registration",
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            verified: false,
          };

          const parsed = insertDocumentSchema.parse(docData);
          await storage.createDocument(parsed);
        }
      }

      await logAudit(businessData.councilId, undefined, "create", "business", business.businessId, null, business);

      res.status(201).json({
        message: "Business registration submitted successfully",
        businessId: business.businessId,
        business
      });
    } catch (error: any) {
      console.error("Business registration error:", error);
      res.status(400).json({ error: "Failed to register business", details: error.message });
    }
  });

  // ================================
  // PROPERTIES
  // ================================
  app.get("/api/v1/properties", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getProperties(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/v1/properties/:propertyId", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/v1/properties", async (req, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      await logAudit(data.councilId, undefined, "create", "property", property.propertyId, null, property);
      res.status(201).json(property);
    } catch (error) {
      res.status(400).json({ error: "Invalid property data" });
    }
  });

  // Legacy endpoint
  app.get("/api/properties", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string || req.query.councilId as string;
      const properties = await storage.getProperties(councilId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const { organizationId, ...rest } = req.body;
      const data = { councilId: organizationId, ...rest };
      const property = await storage.createProperty(data);
      res.status(201).json({ id: property.propertyId, ...property });
    } catch (error) {
      res.status(400).json({ error: "Invalid property data" });
    }
  });

  // ================================
  // SERVICES
  // ================================
  app.get("/api/v1/services", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getServices(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.post("/api/v1/services", async (req, res) => {
    try {
      const data = insertServiceSchema.parse(req.body);
      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid service data" });
    }
  });

  app.patch("/api/v1/services/:id", async (req, res) => {
    try {
      const updates = insertServiceSchema.partial().parse(req.body);
      const updated = await storage.updateService(req.params.id, updates);

      if (!updated) {
        return res.status(404).json({ error: "Service not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/v1/services/:id", async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // ================================
  // SERVICE REQUESTS (replaces license applications)
  // ================================
  app.get("/api/v1/requests", isAuthenticated, async (req, res) => {
    try {
      const councilId = (req.query.councilId as string) || (req.headers["x-council-id"] as string);
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector", "accountant"].includes(user.role);

      console.log(`[API] GET /requests - CouncilID: ${councilId}, User: ${user.email} (${user.role})`);

      if (isAdminOrStaff) {
        const data = await storage.getServiceRequests(councilId);
        res.json(data);
      } else {
        // Citizens only see their own requests
        const myRequests = await storage.getServiceRequestsByRequester(user.userId);
        // Filter by Council ID if provided (optional, but good for consistency)
        const filtered = councilId ? myRequests.filter(r => r.councilId === councilId) : myRequests;
        res.json(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      res.status(500).json({ error: "Failed to fetch service requests" });
    }
  });


  app.get("/api/v1/licensing/workflow/:id", async (req, res) => {
    // Get workflow logic here
    // For now stub
    res.json({ message: "Workflow details" });
  });

  app.get("/api/v1/requests/:requestId", async (req, res) => {
    try {
      const request = await storage.getServiceRequestById(req.params.requestId);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service request" });
    }
  });

  app.post("/api/v1/requests", isAuthenticated, async (req, res) => {
    try {
      const data = insertServiceRequestSchema.parse(req.body);
      // Ensure the user is creating a request for themselves unless they are staff/admin
      // This is implicit if we use req.user.userId as requesterId, but the schema might allow passing it.
      // For now, at least ensure they are logged in.
      const request = await storage.createServiceRequest(data);
      await logAudit(data.councilId, (req.user as any)?.userId, "create", "service_request", request.requestId, null, request);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid service request data" });
    }
  });

  app.patch("/api/v1/requests/:requestId/status", isAuthenticated, async (req, res) => {
    try {
      const { status, preprocessingData } = req.body;

      // Get current request state to check if transition is valid
      const currentRequest = await storage.getServiceRequestById(req.params.requestId);
      if (!currentRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // 1. Enforce Inspection Step
      // Ensure flow: Submitted -> Review -> Inspection -> Approval

      // 2. Strict Document Check
      // Temporarily disabled - database migration didn't apply
      const isAdmin = false;

      if ((status === 'inspection' || status === 'approved') && !isAdmin) {
        const docs = await storage.getDocumentsByOwner(req.params.requestId);

        // Check against requirements
        const licenseTypeId = (currentRequest.formData as any)?.licenseTypeId;
        if (licenseTypeId) {
          const requirements = await storage.getChecklistRequirements(licenseTypeId);

          // Strict Name/Type Check
          // We normalize strings to lowercase/trimmed to potential mismatch issues
          const uploadedTypes = docs.map(d => d.type);

          const missingDocs = requirements.filter(req => {
            // Check if any uploaded document matches the required name
            // exact match or simple inclusion for robustness
            return !docs.some(doc =>
              doc.type === req.documentName ||
              doc.type.toLowerCase() === req.documentName.toLowerCase()
            );
          });

          if (missingDocs.length > 0) {
            return res.status(400).json({
              error: "Missing Documents",
              message: `Application requires the following missing documents: ${missingDocs.map(r => r.documentName).join(', ')}.`
            });
          }
        }

        // Enforce Inspection Report for Approval
        if (status === 'approved') {
          const hasInspectionReport = docs.some(d => d.type === 'Inspection Report');
          if (!hasInspectionReport) {
            return res.status(400).json({
              error: "Inspection Report Required",
              message: "An Inspection Report must be uploaded before the application can be approved."
            });
          }
        }
        // Fallback: If no license type linked, warn but strictly require at least one doc if moving to approval
        if (docs.length === 0) {
          // For legacy requests without licenseType, we might want to block or allow with warning. 
          // User said "ensure all required documents". 
          // We'll enforce at least one.
          return res.status(400).json({
            error: "Missing Documents",
            message: "Application cannot proceed without supporting documents."
          });
        }
      }

      const timestampUpdates: any = {};
      const now = new Date();
      if (status === 'inspection') {
        timestampUpdates.reviewedAt = now;
      } else if (status === 'approved') {
        timestampUpdates.approvedAt = now;
        timestampUpdates.inspectedAt = now; // Assume inspection passed if approved
      }

      const request = await storage.updateServiceRequestStatus(req.params.requestId, status, preprocessingData, timestampUpdates);

      if (request) {
        // Create Notification
        if (request.requesterId && request.requesterId.length > 5) { // Ensure valid user ID
          await storage.createNotification({
            councilId: request.councilId,
            userId: request.requesterId,
            type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
            title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your application ${request.requestRef || request.requestId} has been ${status}.`,
            referenceType: 'service_request',
            referenceId: request.requestId,
            read: false
          });
        }

        // Send Email Notification
        // In a real app, we'd look up the user's email from the User table using requesterId
        // For this prototype/fix, we will use the hardcoded/provided email or catch errors.
        // Assuming we might have a user email on the request or look it up.
        // Since we don't have easy user lookup here without refactoring, 
        // we'll send to the "To" address if we had it, or just use the log/admin email for testing if no user email found.
        // WAIT: The user provided credentials for SENDER. The RECIPIENT should be the applicant.
        // Let's assume we can notify the predefined email for testing if we can't find the user's email.
        // Actually, let's look up the user if possible or just proceed.

        // For the purpose of this task (using credentials provided), 
        // we will send a notification to the provided email (as if they are the user/admin or for verify).
        // OR better: Send to the user-associated email.
        // Let's try to get user email.
        let recipientEmail = 'lawrencemukombo2@gmail.com'; // Fallback
        if (request.requesterId) {
          const user = await storage.getUserById(request.requesterId);
          if (user?.email) recipientEmail = user.email;
        }

        try {
          const emailContent = getStatusChangeEmailContent(status, request.requestId, request.requestRef);
          await sendEmail({
            to: recipientEmail,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
          });
        } catch (emailError) {
          console.error("Failed to send status email:", emailError);
          // Don't fail the request if email fails
        }

        // Audit Log
        await logAudit(
          request.councilId,
          (req.user as any)?.userId,
          "status_change",
          "service_request",
          request.requestId,
          { status: currentRequest.status },
          { status: status }
        );
      }

      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Status update error:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      res.status(500).json({ error: "Failed to update status", details: error?.message });
    }
  });

  // ================================
  // INSPECTIONS
  // ================================
  app.get("/api/v1/inspections", isAuthenticated, async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector"].includes(user.role);

      if (isAdminOrStaff) {
        const data = await storage.getInspections(councilId);
        res.json(data);
      } else {
        // Citizens should generally not see arbitrary inspections unless linked to their requests.
        // For now, return empty or implement similar logic to requests if needed.
        // Assuming citizens don't need to see inspection list directly, or only their own.
        // Let's return empty list for safety or filter by their property/request if possible.
        // Currently storage.getInspections returns ALL.
        // Safe default: return empty for citizens to prevent data leak, until specific requirement.
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  app.get("/api/v1/ping", (req, res) => {
    res.json({ message: "pong", timestamp: new Date().toISOString(), version: "v2" });
  });

  app.post("/api/v1/inspections", isAuthenticated, async (req, res) => {
    try {
      console.log("Inspection POST payload:", req.body);
      // Ensure only staff can create inspections
      const user = req.user as any;
      if (!["admin", "manager", "officer", "inspector"].includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const data = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(data);
      await logAudit(data.councilId, undefined, "create", "inspection", inspection.inspectionId, null, inspection);
      res.status(201).json(inspection);
    } catch (error: any) {
      // ... existing error handling ...
      console.error("Inspection Creation Error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      }
      res.status(400).json({ error: "Failed to create inspection" });
    }
  });

  // ... (Licences header) ...

  // ================================
  // PAYMENTS & VERIFICATION
  // ================================

  app.post("/api/v1/payments", isAuthenticated, async (req, res) => {
    console.log("Incoming Payment Request:", JSON.stringify(req.body, null, 2));
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      console.log("Parsed Payment Data:", JSON.stringify(paymentData, null, 2));

      // External Verification for Card/Mobile
      if (["credit_card", "debit_card", "mobile_money"].includes(paymentData.method)) {

        let result;
        const details = paymentData.paymentDetails as any;

        if (paymentData.method === "mobile_money") {
          if (!details?.provider || !details?.phoneNumber) {
            console.error("Missing mobile money details");
            return res.status(400).json({ error: "Missing mobile money details" });
          }
          result = await PaymentGateway.verifyMobileMoney(Number(paymentData.amount), {
            provider: details.provider,
            phoneNumber: details.phoneNumber
          });
        } else {
          // Cards
          if (!details?.number || !details?.expiry || !details?.cvc || !details?.name) {
            console.error("Missing card details");
            return res.status(400).json({ error: "Missing card details" });
          }
          result = await PaymentGateway.verifyCreditCard(Number(paymentData.amount), {
            number: details.number,
            expiry: details.expiry,
            cvc: details.cvc,
            name: details.name
          });
        }

        if (!result.success) {
          console.error("Payment Verification Failed:", result.message);
          return res.status(400).json({ error: "Payment Verification Failed", details: result.message });
        }

        // Update data with external ref
        paymentData.externalReference = result.transactionId;
        paymentData.status = "completed";
        paymentData.paidAt = new Date();
      } else {
        // Cash/Cheque - Auto-complete for now (or pending if workflow requires)
        paymentData.status = "completed";
        paymentData.paidAt = new Date();
      }

      console.log("Saving payment to DB...");
      const payment = await storage.createPayment(paymentData);
      console.log("Successfully created payment:", payment.paymentId);

      // Run audit in background
      logAudit(paymentData.councilId, (req.user as any)?.userId, "create", "payment", payment.paymentId, null, payment)
        .catch(err => console.error("Non-blocking audit error:", err));

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Payment Error:", error);
      if (error.name === 'ZodError') {
        console.error("Zod Validation Error Details:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  // ================================
  // LICENCES (Issuance)
  // ================================
  app.get("/api/v1/payments", isAuthenticated, async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector"].includes(user.role);

      if (isAdminOrStaff) {
        const payments = await storage.getPayments(councilId);
        res.json(payments);
      } else {
        // Citizens should generally not see arbitrary payments lists.
        // Filter by payer/requester if possible, but payments table lacks requesterId directly usually (it links to requestRef).
        // For now, return empty or implement specific lookup.
        // Safety first:
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app.post("/api/v1/licences/issue", isAuthenticated, async (req, res) => {
    try {
      const { requestId, councilId, issueDate, expiryDate } = req.body;
      console.log(`[Issuance] Request received for RequestID: ${requestId}, Council: ${councilId}`);

      const request = await storage.getServiceRequestById(requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const tenantConfig = await storage.getTenantConfig(councilId);
      const councilName = tenantConfig?.councilName || "National Capital District Commission";

      const isAdmin = (req.user as any)?.role === 'admin';
      if (!isAdmin) {
        const payments = await storage.getPayments(councilId);
        const relatedPayment = payments.find(p => p.paymentRef === requestId && p.status === 'completed');
        if (!relatedPayment) {
          return res.status(400).json({ error: "Payment Required", message: "Cannot issue license without verified payment." });
        }
      }

      // 1. Prepare Canonical Data
      const requestData = (request.processingData as any) || (request.formData as any) || {};
      const service = await storage.getServiceById(request.serviceId);

      const payload = {
        licenceNo: `LIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, // Temporary until saved
        councilId,
        requestId,
        issueDate: (issueDate ? new Date(issueDate) : new Date()).toISOString(),
        expiryDate: (expiryDate ? new Date(expiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))).toISOString(),
        tradingName: requestData.tradingName || requestData.businessName || "Unknown",
        applicantName: requestData.applicantName || requestData.contactPerson || "Unknown",
        premisesAddress: typeof requestData.premisesAddress === 'object' ? `${requestData.premisesAddress.section || ''} ${requestData.premisesAddress.lot || ''} ${requestData.premisesAddress.suburb || ''}` : (requestData.premisesAddress || "Not Specified"),
        serviceName: service?.name || "General Trading",
      };

      const { json: canonicalJson, hash: payloadHash } = DigitalSignatureService.canonicalizeLicence(payload);

      // 2. Generate PDF
      const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${payload.licenceNo}`;
      const pdfBuffer = await PdfService.generateLicencePdf({
        ...payload,
        issueDate: new Date(payload.issueDate),
        expiryDate: new Date(payload.expiryDate),
        councilName,
        licenceId: requestId, // We'll update this with real licenceId after creation
        verifyUrl
      });
      const unsignedPdfHash = DigitalSignatureService.calculateFileHash(pdfBuffer);

      // 3. Sign PDF (Digital Seal)
      const { privateKey } = await DigitalSignatureService.getCouncilKey(councilId);
      const signature = DigitalSignatureService.signData(pdfBuffer, privateKey);

      // In a real PAdES implementation, we would embed the signature into the PDF.
      // For this prototype, we store the signature metadata and the signed hash.
      const signedPdfHash = DigitalSignatureService.calculateFileHash(Buffer.concat([pdfBuffer, Buffer.from(signature, 'hex')]));

      // 4. Save to Disk
      const certDir = path.join(process.cwd(), "uploads", "certificates");
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }
      const filename = `${payload.licenceNo}.pdf`;
      const filePath = path.join(certDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      // 5. Create Licence Record
      const licence = await storage.createLicence({
        councilId,
        requestId,
        licenceNo: payload.licenceNo,
        issueDate: new Date(payload.issueDate),
        expiryDate: new Date(payload.expiryDate),
        status: "active",
        licencePayloadHash: payloadHash,
        pdfHash: unsignedPdfHash,
        signedPdfHash: signedPdfHash,
        signatureMetadata: {
          algorithm: "RSASSA-PKCS1-v1_5-SHA256",
          issuedAt: new Date().toISOString(),
          signature: signature
        }
      });

      // 6. Create Document Record
      await storage.createDocument({
        councilId,
        ownerType: "licence",
        ownerId: licence.licenceId,
        name: "Official Licence Certificate",
        type: "Certificate",
        fileName: filename,
        filePath: filePath,
        url: `/uploads/certificates/${filename}`,
        mimeType: "application/pdf",
        fileSize: pdfBuffer.length,
        status: "approved",
        verified: true,
      });

      // Update request status
      await storage.updateServiceRequestStatus(requestId, "issued", {
        licenceId: licence.licenceId,
        issuedAt: new Date().toISOString()
      }, {
        issuedAt: new Date(),
        completedAt: new Date()
      });

      logAudit(councilId, (req.user as any)?.userId, "create", "licence", licence.licenceId, null, licence).catch(console.error);

      // Email Notification...
      try {
        const [applicant] = await db.select().from(users).where(eq(users.userId, request.requesterId));
        const email = applicant?.email || (request.formData as any)?.contactEmail;
        if (email) {
          await sendEmail({
            to: email,
            subject: `License Issued: ${licence.licenceNo}`,
            text: `Your license ${licence.licenceNo} has been issued.`,
            html: `<h2>License Issued</h2><p>Your license <b>${licence.licenceNo}</b> is ready.</p>`
          });
        }
      } catch (e) {
        console.error("Email error:", e);
      }

      res.status(201).json(licence);
    } catch (error: any) {
      console.error("Issue License Error:", error);
      res.status(500).json({ error: "Failed to issue license", details: error.message });
    }
  });

  app.get("/api/v1/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector"].includes(user.role);

      if (!isAdminOrStaff) {
        return res.status(403).json({ error: "Unauthorized access to dashboard stats" });
      }

      const councilId = user.councilId || req.headers["x-council-id"] as string || "ncdc_council_id";
      const stats = await storage.getDashboardStats(councilId);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Payments Endpoint for Finance Page
  app.get("/api/v1/payments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "accountant"].includes(user.role);

      if (!isAdminOrStaff) {
        return res.status(403).json({ error: "Unauthorized access to payments" });
      }

      const councilId = user.councilId || req.headers["x-council-id"] as string || "ncdc_council_id";
      const payments = await storage.getPayments(councilId);

      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/v1/payments/manual", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "accountant"].includes(user.role);

      if (!isAdminOrStaff) {
        return res.status(403).json({ error: "Unauthorized to record payments" });
      }

      const councilId = user.councilId || req.headers["x-council-id"] as string || "ncdc_council_id";
      const { amount, method, payer, reference, description } = req.body;

      if (!amount || !method) {
        return res.status(400).json({ error: "Amount and method are required" });
      }

      const payment = await storage.createPayment({
        councilId,
        accountId: user.userId, // Recorded by this user
        paymentRef: reference || `MAN-${Date.now()}`,
        amount: String(amount),
        currency: "PGK",
        method,
        status: "completed", // Manual payments are usually confirmed immediately
        paidAt: new Date(),
        paymentDetails: {
          payer: payer || "Walk-in Customer",
          description: description || "Manual Payment",
          recordedBy: user.email
        }
      });

      // Log audit
      logAudit(councilId, user.userId, "create", "payment", payment.paymentId, { amount, method }).catch(console.error);

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error recording payment:", error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  // Invoices Endpoint for Finance Page
  app.get("/api/v1/invoices", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "accountant"].includes(user.role);

      if (!isAdminOrStaff) {
        return res.status(403).json({ error: "Unauthorized access to invoices" });
      }

      const councilId = user.councilId || req.headers["x-council-id"] as string || "ncdc_council_id";
      const invoices = await storage.getInvoices(councilId);

      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/v1/requests/:id/licence", async (req, res) => {
    try {
      const licence = await storage.getLicenceByRequestId(req.params.id);
      if (!licence) return res.status(404).json({ error: "Licence not found" });
      res.json(licence);
    } catch (error) {
      res.status(500).json({ error: "Failed to get licence" });
    }
  });

  app.get("/api/v1/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(req.params.id);
      if (!inspection) return res.status(404).json({ error: "Inspection not found" });
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  app.patch("/api/v1/inspections/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateInspection(req.params.id, updates);

      if (!updated) return res.status(404).json({ error: "Inspection not found" });

      // Automate workflow transition if inspection is passed/failed
      if (updates.result && updated.requestId) {
        // This would ideally interact with the workflow engine
        // For prototype, we might just leave it here or add a hook
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inspection" });
    }
  });

  // Legacy endpoint
  app.get("/api/inspections", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const inspections = await storage.getInspections(councilId);
      const mapped = inspections.map(i => ({
        id: i.inspectionId,
        organizationId: i.councilId,
        ...i
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  // ================================
  // INVOICES
  // ================================
  app.get("/api/v1/invoices", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getInvoices(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/v1/invoices", async (req, res) => {
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(data);
      await logAudit(data.councilId, undefined, "create", "invoice", invoice.invoiceId, null, invoice);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Legacy endpoint
  app.get("/api/invoices", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const invoices = await storage.getInvoices(councilId);
      const mapped = invoices.map(i => ({
        id: i.invoiceId,
        invoiceNumber: i.invoiceNo,
        organizationId: i.councilId,
        ...i
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Duplicate payment GET route removed

  // Duplicate payment route removed - see earlier definition for verification logic

  // Legacy endpoint
  app.get("/api/transactions", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const payments = await storage.getPayments(councilId);
      const mapped = payments.map(p => ({
        id: p.paymentId,
        transactionNumber: p.paymentRef,
        type: "payment",
        organizationId: p.councilId,
        ...p
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ================================
  // LICENCES
  // ================================
  app.get("/api/v1/verify/:licenceNo", async (req, res) => {
    try {
      const { licenceNo } = req.params;
      const licence = await storage.getLicenceByNo(licenceNo);

      if (!licence) {
        return res.status(404).json({ valid: false, message: "Licence not found" });
      }

      // 1. Check expiry
      const isExpired = licence.expiryDate ? new Date(licence.expiryDate) < new Date() : true;

      // 2. Cryptographic Integrity Check
      let integrityVerified = false;
      const certPath = path.join(process.cwd(), "uploads", "certificates", `${licenceNo}.pdf`);

      if (fs.existsSync(certPath)) {
        const pdfBuffer = fs.readFileSync(certPath);
        const currentPdfHash = DigitalSignatureService.calculateFileHash(pdfBuffer);

        // Check if signature exists and hash matches
        if (licence.pdfHash === currentPdfHash) {
          integrityVerified = true;
        }
      }

      res.json({
        valid: !isExpired && integrityVerified,
        status: isExpired ? "expired" : (integrityVerified ? "active" : "invalid_integrity"),
        cryptographicallySigned: !!licence.signedPdfHash,
        integrityVerified,
        licence: {
          ...licence,
          issueDate: licence.issueDate ? new Date(licence.issueDate).toLocaleDateString() : null,
          expiryDate: licence.expiryDate ? new Date(licence.expiryDate).toLocaleDateString() : null,
        }
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/v1/licences", isAuthenticated, async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const user = req.user as any;
      const isAdminOrStaff = ["admin", "manager", "officer", "inspector"].includes(user.role);

      const allLicences = await storage.getLicences(councilId);

      if (isAdminOrStaff) {
        res.json(allLicences);
      } else {
        // Filter for citizens: Verify ownership via Request -> User or Business -> User
        // This requires 'getLicences' to probably fetch relations or we do it here.
        // For prototype speed: we will start by ONLY showing licences linked to requests made by this user.
        // TODO: Enhance Storage to do this efficiently (e.g. getLicencesByUser)
        const userRequests = await storage.getServiceRequestsByRequester(user.userId);
        const userRequestIds = userRequests.map(r => r.requestId);

        const myLicences = allLicences.filter((l: any) => userRequestIds.includes(l.requestId));
        res.json(myLicences);
      }
    } catch (error) {
      console.error("Failed to fetch licences:", error);
      res.status(500).json({ error: "Failed to fetch licences" });
    }
  });

  app.post("/api/v1/licences", async (req, res) => {
    try {
      const data = insertLicenceSchema.parse(req.body);
      const licence = await storage.createLicence(data);
      await logAudit(data.councilId, undefined, "create", "licence", licence.licenceId, null, licence);
      res.status(201).json(licence);
    } catch (error) {
      res.status(400).json({ error: "Invalid licence data" });
    }
  });

  // Legacy endpoint
  app.get("/api/licenses", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const licences = await storage.getLicences(councilId);
      const mapped = licences.map(l => ({
        id: l.licenceId,
        licenseNumber: l.licenceNo,
        organizationId: l.councilId,
        ...l
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  });

  // ================================
  // LICENSE TYPES & REQUIREMENTS
  // ================================
  app.get("/api/v1/license-types", async (req, res) => {
    try {
      const data = await storage.getLicenseTypes();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch license types" });
    }
  });

  app.get("/api/v1/license-types/:id", async (req, res) => {
    try {
      const data = await storage.getLicenseTypeById(req.params.id);
      if (!data) return res.status(404).json({ error: "License type not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch license type" });
    }
  });

  app.post("/api/v1/license-types", async (req, res) => {
    try {
      const data = insertLicenseTypeSchema.parse(req.body);
      const created = await storage.createLicenseType(data);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: "Invalid license type data" });
    }
  });

  app.get("/api/v1/license-types/:id/checklist", async (req, res) => {
    try {
      const data = await storage.getChecklistRequirements(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist requirements" });
    }
  });

  app.get("/api/v1/license-types/:id/special-requirements", async (req, res) => {
    try {
      const data = await storage.getSpecialRequirements(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch special requirements" });
    }
  });

  app.get("/api/v1/license-type-fees", async (req, res) => {
    try {
      const data = await storage.getLicenseTypeFees();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch license type fees", details: error.message, stack: error.stack });
    }
  });

  app.post("/api/v1/license-type-fees", async (req, res) => {
    try {
      const data = insertLicenseTypeFeeSchema.parse(req.body);
      const created = await storage.createLicenseTypeFee(data);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: "Invalid license type fee data" });
    }
  });

  app.patch("/api/v1/license-type-fees/:id", async (req, res) => {
    try {
      const updated = await storage.updateLicenseTypeFee(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Fee not found" });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update license type fee" });
    }
  });


  // ================================
  // LICENSING APPLICATIONS
  // ================================
  app.post("/api/v1/licensing/apply-test", async (req, res) => {
    try {
      const { businessId, licenseTypeId, councilId, formData } = req.body;

      // Robust validation
      if (!businessId || !licenseTypeId || !councilId) {
        console.error("Missing fields in apply-test:", { businessId, licenseTypeId, councilId });
        const missing = [];
        if (!businessId) missing.push("businessId");
        if (!licenseTypeId) missing.push("licenseTypeId");
        if (!councilId) missing.push("councilId");
        return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      }

      // Find a suitable service definition for licensing
      console.log(`[Apply] Finding service for CouncilID: ${councilId}`);
      const services = await storage.getServices(councilId);
      console.log(`[Apply] Found ${services.length} services for council ${councilId}`);

      const licensingService = services.find(s => s.category === "licensing") || services[0];

      if (!licensingService) {
        console.error(`[Apply] CRITICAL: No services found for council ${councilId}`);
        return res.status(400).json({ error: "Service not found", message: `No service configuration found for council ${councilId}` });
      }

      console.log(`[Apply] Using service: ${licensingService.name} (${licensingService.serviceId})`);

      // Duplicate Check
      // Block submission if an application for the same business + licenseType already exists in the current year
      const existingRequests = await storage.getServiceRequestsByRequester(businessId);
      const currentYear = new Date().getFullYear();
      console.log(`[Apply] Checking duplicates for Business ${businessId}, Type ${licenseTypeId}, Year ${currentYear}. Found ${existingRequests.length} existing requests.`);

      const duplicate = existingRequests.find(r => {
        const data = r.formData as any;
        const rType = data?.licenseTypeId;

        // Robust Date Parsing
        const rDate = r.submittedAt ? new Date(r.submittedAt) : (r.createdAt ? new Date(r.createdAt) : new Date());
        const rYear = rDate.getFullYear();

        const isSameType = String(rType) === String(licenseTypeId);
        const isSameYear = rYear === currentYear;
        const isRelevantStatus = !['rejected', 'draft', 'cancelled', 'withdrawn'].includes(r.status);

        if (isSameType && isSameYear && isRelevantStatus) {
          console.log(`[Apply] Duplicate Match Found: ${r.requestId} (${r.status})`);
          return true;
        }
        return false;
      });

      if (duplicate) {
        return res.status(400).json({
          error: "Duplicate Application",
          message: `This company already has an active ${licensingService.name} application for the ${currentYear} period (REF: ${duplicate.requestRef || duplicate.requestId.substring(0, 8)}). Status: ${duplicate.status}`
        });
      }

      // Create the service request with workflow
      const { request, workflow } = await storage.createServiceRequestWithWorkflow({
        councilId,
        serviceId: licensingService.serviceId,
        requesterType: "business",
        requesterId: businessId,
        status: "submitted",
        channel: "web",
        formData: {
          licenseTypeId,
          ...formData
        },
        requestRef: `LIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        submittedAt: new Date(),
      }, licensingService.serviceId);

      // Return exactly what the frontend expects
      res.status(201).json({ request, workflow });
    } catch (error: any) {
      console.error("Apply error:", error);
      res.status(500).json({ error: error.message || "Failed to submit application" });
    }
  });
  // ================================
  // MARKETS & STALLS
  // ================================
  app.get("/api/v1/markets", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getMarkets(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch markets" });
    }
  });

  app.post("/api/v1/markets", async (req, res) => {
    try {
      const data = insertMarketSchema.parse(req.body);
      const market = await storage.createMarket(data);
      res.status(201).json(market);
    } catch (error) {
      res.status(400).json({ error: "Invalid market data" });
    }
  });

  app.get("/api/v1/stalls", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string;
      const marketId = req.query.marketId as string;
      const data = await storage.getStalls(councilId, marketId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stalls" });
    }
  });

  app.post("/api/v1/stalls", async (req, res) => {
    try {
      const data = insertStallSchema.parse(req.body);
      const stall = await storage.createStall(data);
      res.status(201).json(stall);
    } catch (error) {
      res.status(400).json({ error: "Invalid stall data" });
    }
  });

  // ================================
  // COMPLAINTS
  // ================================
  app.get("/api/v1/complaints", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getComplaints(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  app.post("/api/v1/complaints", async (req, res) => {
    try {
      const data = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint(data);
      await logAudit(data.councilId, undefined, "create", "complaint", complaint.complaintId, null, complaint);
      res.status(201).json(complaint);
    } catch (error) {
      res.status(400).json({ error: "Invalid complaint data" });
    }
  });

  // Legacy endpoint
  app.get("/api/complaints", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const complaints = await storage.getComplaints(councilId);
      const mapped = complaints.map(c => ({
        id: c.complaintId,
        organizationId: c.councilId,
        ...c
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // ================================
  // ENFORCEMENT
  // ================================
  app.get("/api/v1/enforcement", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getEnforcementCases(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enforcement cases" });
    }
  });

  app.post("/api/v1/enforcement", async (req, res) => {
    try {
      const data = insertEnforcementCaseSchema.parse(req.body);
      const enfCase = await storage.createEnforcementCase(data);
      await logAudit(data.councilId, undefined, "create", "enforcement_case", enfCase.caseId, null, enfCase);
      res.status(201).json(enfCase);
    } catch (error) {
      res.status(400).json({ error: "Invalid enforcement case data" });
    }
  });

  // Legacy endpoint
  app.get("/api/enforcement-cases", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const cases = await storage.getEnforcementCases(councilId);
      const mapped = cases.map(c => ({
        id: c.caseId,
        caseNumber: c.caseNo,
        organizationId: c.councilId,
        ...c
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enforcement cases" });
    }
  });

  // ================================
  // AUDIT LOGS
  // ================================
  app.get("/api/v1/audit/logs", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getAuditLogs(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Legacy endpoint
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string;
      const logs = await storage.getAuditLogs(councilId);
      const mapped = logs.map(l => ({
        id: l.auditId,
        organizationId: l.councilId,
        ...l
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // ================================
  // ASSETS
  // ================================
  app.get("/api/assets", async (req, res) => {
    try {
      const councilId = req.query.organizationId as string || req.query.councilId as string;
      const data = await storage.getAssets(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.get("/api/v1/assets", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getAssets(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:assetId", async (req, res) => {
    try {
      const asset = await storage.getAssetById(req.params.assetId);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const data = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(data);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });

  app.patch("/api/assets/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;
      const existing = await storage.getAssetById(assetId);
      if (!existing) {
        return res.status(404).json({ error: "Asset not found" });
      }
      const updated = await storage.updateAsset(assetId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update asset" });
    }
  });

  // ================================
  // DASHBOARD STATS
  // ================================
  // Legacy dashboard route removed


  // ================================
  // USER MANAGEMENT
  // ================================

  // ================================
  // USER MANAGEMENT
  // ================================
  addUserManagementRoutes(app, storage);

  // ================================
  // TENANT CONFIGURATION
  // ================================
  app.get("/api/v1/tenant/config", async (req, res) => {
    try {
      // Default to NCDC if no councilId provided (e.g. on first load)
      const councilId = req.headers["x-council-id"] as string ||
        req.query.councilId as string ||
        "3c4d4a9f-92a7-4dd2-82fb-ceff90c57094";

      const config = await storage.getTenantConfig(councilId);

      if (!config) {
        // Return default if not found
        return res.json({
          configId: "default",
          councilId,
          councilName: "National Capital District Commission",
          shortName: "NCDC",
          logoUrl: "/logo.png",
          primaryColor: "#0F0F0F",
          secondaryColor: "#F4C400",
          accentColor: "#F4C400",
          primaryForeground: "#F4C400", // NCDC Yellow
          positiveColor: "#10b981",
          warningColor: "#f59e0b",
          negativeColor: "#ef4444",
          borderRadius: 4,
          buttonRadius: 4,
          cardRadius: 8,
          inputRadius: 4,
          sidebarBackground: "#0F0F0F",
          headerBackground: "#F4C400",
          fontFamily: "Inter",
          locationLevels: ["Country", "Province", "District", "Ward", "Section", "Lot"],
          locale: "en-PG",
          timezone: "Pacific/Port_Moresby",
          dateFormat: "DD/MM/YYYY",
          timeFormat: "HH:mm",
          firstDayOfWeek: "monday",
          currency: "PGK",
          currencySymbol: "K",
          currencyPosition: "before",
          decimalSeparator: ".",
          thousandsSeparator: ",",
          enabledModules: [
            "dashboard", "registry", "licensing", "services", "payments",
            "inspections", "enforcement", "complaints", "audit",
            "gis", "properties", "planning", "environment", "building",
            "assets", "waste", "procurement", "fleet",
            "portal", "mobile", "notifications", "feedback",
            "reports", "api", "documents", "workflows", "configuration"
          ]
        });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching tenant config:", error);
      res.status(500).json({ error: "Failed to fetch tenant configuration" });
    }
  });

  app.patch("/api/v1/tenant/config", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.body.councilId as string;
      if (!councilId) {
        return res.status(400).json({ error: "councilId is required" });
      }

      console.log(`[TenantConfig] Updating for council: ${councilId}`);
      const updates = req.body;
      console.log(`[TenantConfig] Updates:`, JSON.stringify(updates, null, 2));

      const config = await storage.updateTenantConfig(councilId, updates);

      res.json(config);
    } catch (error) {
      console.error("Error updating tenant config:", error);
      res.status(500).json({ error: "Failed to update tenant configuration" });
    }
  });

  // ================================
  // LICENSE TYPES & REQUIREMENTS
  // ================================
  app.get("/api/v1/license-types", async (req, res) => {
    try {
      const data = await storage.getLicenseTypes();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch license types" });
    }
  });

  app.post("/api/v1/license-types", async (req, res) => {
    try {
      const data = insertLicenseTypeSchema.parse(req.body);
      const lt = await storage.createLicenseType(data);
      res.status(201).json(lt);
    } catch (error) {
      res.status(400).json({ error: "Invalid license type data" });
    }
  });

  app.patch("/api/v1/license-types/:id", async (req, res) => {
    try {
      const updates = insertLicenseTypeSchema.partial().parse(req.body);
      const lt = await storage.updateLicenseType(req.params.id, updates);
      if (!lt) return res.status(404).json({ error: "License type not found" });
      res.json(lt);
    } catch (error) {
      res.status(400).json({ error: "Invalid updates" });
    }
  });

  app.delete("/api/v1/license-types/:id", async (req, res) => {
    try {
      const success = await storage.deleteLicenseType(req.params.id);
      if (!success) return res.status(404).json({ error: "License type not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete license type" });
    }
  });

  // Checklist Requirements
  app.get("/api/v1/license-types/:id/checklist", async (req, res) => {
    try {
      const data = await storage.getChecklistRequirements(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  app.post("/api/v1/license-types/:id/checklist", async (req, res) => {
    try {
      const data = insertChecklistRequirementSchema.parse({ ...req.body, licenseTypeId: req.params.id });
      const req_obj = await storage.createChecklistRequirement(data);
      res.status(201).json(req_obj);
    } catch (error) {
      res.status(400).json({ error: "Invalid checklist data" });
    }
  });

  app.patch("/api/v1/checklist-requirements/:id", async (req, res) => {
    try {
      const updates = insertChecklistRequirementSchema.partial().parse(req.body);
      const req_obj = await storage.updateChecklistRequirement(req.params.id, updates);
      if (!req_obj) return res.status(404).json({ error: "Requirement not found" });
      res.json(req_obj);
    } catch (error) {
      res.status(400).json({ error: "Invalid updates" });
    }
  });

  app.delete("/api/v1/checklist-requirements/:id", async (req, res) => {
    try {
      const success = await storage.deleteChecklistRequirement(req.params.id);
      if (!success) return res.status(404).json({ error: "Requirement not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete requirement" });
    }
  });

  // Special Requirements
  app.get("/api/v1/license-types/:id/special", async (req, res) => {
    try {
      const data = await storage.getSpecialRequirements(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch special requirements" });
    }
  });

  app.post("/api/v1/license-types/:id/special", async (req, res) => {
    try {
      const data = insertSpecialRequirementSchema.parse({ ...req.body, licenseTypeId: req.params.id });
      const req_obj = await storage.createSpecialRequirement(data);
      res.status(201).json(req_obj);
    } catch (error) {
      res.status(400).json({ error: "Invalid special requirement data" });
    }
  });

  app.patch("/api/v1/special-requirements/:id", async (req, res) => {
    try {
      const updates = insertSpecialRequirementSchema.partial().parse(req.body);
      const req_obj = await storage.updateSpecialRequirement(req.params.id, updates);
      if (!req_obj) return res.status(404).json({ error: "Requirement not found" });
      res.json(req_obj);
    } catch (error) {
      res.status(400).json({ error: "Invalid updates" });
    }
  });

  app.delete("/api/v1/special-requirements/:id", async (req, res) => {
    try {
      const success = await storage.deleteSpecialRequirement(req.params.id);
      if (!success) return res.status(404).json({ error: "Requirement not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete requirement" });
    }
  });

  // ================================
  // ASSETS
  // ================================
  app.get("/api/v1/assets", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getAssets(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/v1/assets", async (req, res) => {
    try {
      const data = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(data);
      await logAudit(data.councilId, (req.user as any)?.userId, "create", "asset", asset.assetId, null, asset);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });

  // ================================
  // PAYMENTS (ONLINE)
  // ================================
  app.post("/api/v1/payments/online", async (req, res) => {
    try {
      const { amount, method, paymentDetails, accountId } = req.body;
      const amountVal = parseFloat(amount);

      if (isNaN(amountVal) || amountVal <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      let result;
      if (method === 'credit_card') {
        result = await PaymentGateway.verifyCreditCard(amountVal, paymentDetails);
      } else if (method === 'mobile_money') {
        result = await PaymentGateway.verifyMobileMoney(amountVal, paymentDetails);
      } else {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      // Success - Record Payment
      const paymentData = {
        councilId: req.headers["x-council-id"] as string || "ncdc-council-id",
        accountId: accountId || "guest-account",
        paymentRef: result.transactionId || `PAY-${Date.now()}`,
        amount: amountVal.toString(),
        currency: "PGK",
        method: method,
        provider: method === 'credit_card' ? 'Visa/Mastercard' : (paymentDetails?.provider || 'Mobile Money'),
        status: "completed",
        externalReference: result.transactionId,
        paymentDetails: result.details,
        paidAt: new Date(),
      };

      const payment = await storage.createPayment(paymentData);

      // Audit
      await logAudit(payment.councilId, (req.user as any)?.userId, "create", "payment", payment.paymentId, null, payment);

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // ================================
  // PROCUREMENT
  // ================================
  app.get("/api/v1/procurement/orders", async (req, res) => {
    try {
      const councilId = req.headers["x-council-id"] as string || req.query.councilId as string;
      const data = await storage.getPurchaseOrders(councilId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/v1/procurement/orders", async (req, res) => {
    try {
      const data = insertPurchaseOrderSchema.parse(req.body);
      const order = await storage.createPurchaseOrder(data);
      await logAudit(data.councilId, (req.user as any)?.userId, "create", "purchase_order", order.orderId, null, order);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase order data" });
    }
  });

  app.get("/api/v1/procurement/orders/:id", async (req, res) => {
    try {
      const order = await storage.getPurchaseOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const lines = await storage.getPurchaseOrderLines(req.params.id);
      res.json({ ...order, lines });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  });

  return httpServer;
}
