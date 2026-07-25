import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

/**
 * Country (Tenant) Scoping Middleware
 *
 * Attaches `req.countryId` to every authenticated request:
 *  - System Administrator: countryId = null  (sees all tenants)
 *  - All other roles:      countryId derived from user's council's countryId
 *
 * Use `req.countryId` in route handlers to filter data by tenant.
 */
export async function countryScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next();
  }

  const user = req.user as User & { roleName?: string };

  // System Administrator bypasses all country scoping
  if (user?.roleName === "System Administrator" || user?.role === "admin") {
    (req as any).countryId = null;
    (req as any).isSuperAdmin = true;
    return next();
  }

  try {
    if (user?.councilId) {
      const council = await storage.getCouncilById(user.councilId);
      (req as any).countryId = council?.countryId ?? null;
    } else {
      (req as any).countryId = null;
    }
  } catch {
    (req as any).countryId = null;
  }

  next();
}

/**
 * Middleware: Require System Administrator role.
 * Use on routes that only System Admins may access (e.g. country management).
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isSuperAdmin) {
    return res.status(403).json({ success: false, message: "Access restricted to System Administrators." });
  }
  next();
}
