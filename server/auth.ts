import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";


const scryptAsync = promisify(scrypt);

// Basic in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;
const ipRateMap = new Map<string, { count: number, windowStart: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = ipRateMap.get(ip);

    if (!record) {
        ipRateMap.set(ip, { count: 1, windowStart: now });
        return true;
    }

    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
        // Reset window
        ipRateMap.set(ip, { count: 1, windowStart: now });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    record.count += 1;
    return true;
}

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    try {
        console.log(`[Auth] Comparing passwords. Stored hash length: ${stored?.length || 0}`);
        if (!stored || !stored.includes(".")) {
            console.error("[Auth] Malformed password hash in database. Missing '.' separator.");
            return false;
        }
        const [hashed, salt] = stored.split(".");
        if (!hashed || !salt) {
            console.error("[Auth] Malformed password hash parts. Hashed or salt is missing.");
            return false;
        }
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        const isMatch = timingSafeEqual(hashedBuf, suppliedBuf);
        console.log(`[Auth] Password comparison result: ${isMatch}`);
        return isMatch;
    } catch (error) {
        console.error("[Auth] Error during password comparison:", error);
        throw error;
    }
}

import pgSession from "connect-pg-simple";
import { pool } from "./db";

export function setupAuth(app: Express) {
    const PgSession = pgSession(session);
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "lgis_secret_key_replit_production",
        resave: false,
        saveUninitialized: false,
        store: new PgSession({
            pool: pool,
            tableName: 'session',
            createTableIfMissing: false // Table is created via Drizzle schema (db:push)
        }),
        cookie: {
            secure: process.env.NODE_ENV === "production" && process.env.HTTPS === "true", // Only use secure cookies if HTTPS is explicitly enabled
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    };

    app.set("trust proxy", 1);
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
            try {
                console.log(`[Auth] Strategy started for: ${email}`);
                const user = await storage.getUserByEmail(email);
                if (!user) {
                    console.log(`[Auth] User not found: ${email}`);
                    return done(null, false);
                }

                console.log(`[Auth] User found, comparing passwords for: ${email}`);
                const isMatch = await comparePasswords(password, user.passwordHash);
                if (!isMatch) {
                    console.log(`[Auth] Password mismatch for: ${email}`);
                    return done(null, false);
                }

                console.log(`[Auth] Login successful for: ${email}`);
                return done(null, user);
            } catch (err) {
                console.error("[Auth] Fatal Error during strategy execution:", err);
                return done(err);
            }
        }),
    );

    passport.serializeUser((user, done) => {
        console.log(`[Auth] Serializing user: ${(user as User).userId}`);
        done(null, (user as User).userId);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            console.log(`[Auth] Deserializing user ID: ${id}`);
            const user = await storage.getUserById(id);
            if (!user) console.log(`[Auth] Deserialization failed: User not found for ID: ${id}`);
            done(null, user);
        } catch (err) {
            console.error(`[Auth] Deserialization error for ID ${id}:`, err);
            done(err);
        }
    });

    app.post("/api/register", async (req, res, next) => {
        const clientIp = req.ip || "unknown";

        // 1. Rate Limiting Check
        if (!checkRateLimit(clientIp)) {
            console.warn(`[Auth] Rate limit exceeded for IP: ${clientIp}`);
            return res.status(429).send("Too many registration attempts. Please try again later.");
        }

        // 2. Honeypot Check (Anti-Spam)
        if (req.body._honey) {
            console.warn(`[Auth] Bot detected via honeypot from IP: ${clientIp}`);
            // Return success to confuse the bot, but do nothing
            return res.status(200).json({ message: "Registration successful" });
        }

        try {
            const existingUser = await storage.getUserByEmail(req.body.email);
            if (existingUser) {
                return res.status(400).send("Email already exists");
            }

            const hashedPassword = await hashPassword(req.body.password);
            const user = await storage.createUser({
                ...req.body,
                passwordHash: hashedPassword,
                councilId: req.body.councilId, // Should be validated or derived
                unitId: req.body.unitId || null,
                status: "active",
                createdAt: new Date(),
                mfaEnabled: false
            });

            // Create Citizen Profile for the new User
            if (user) {
                try {
                    const nameParts = user.fullName.split(" ");
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(" ") || firstName; // Fallback if no last name

                    await storage.createCitizen({
                        userId: user.userId,
                        councilId: user.councilId,
                        firstName: firstName,
                        lastName: lastName,
                        email: user.email,
                        phone: user.phone,
                        // Defaults
                        dob: new Date().toISOString(),
                        sex: "other", // Schema uses 'sex'
                        address: "Not Provided",
                    });
                    console.log(`[Auth] Created citizen profile for user: ${user.fullName}`);
                } catch (citizenError) {
                    console.error("[Auth] Failed to create citizen profile:", citizenError);
                    // Non-fatal, user created but citizen link failed. 
                    // Should probably allow login but prompt for profile completion.
                }
            }

            req.login(user, (err) => {
                if (err) return next(err);
                res.status(201).json(user);
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/login", (req, res, next) => {
        const { email } = req.body;
        console.log(`[Auth] Received login request for: ${email}`);
        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) {
                console.error(`[Auth] Fatal Middleware Error for ${email}:`, err);
                return res.status(500).json({
                    message: "Internal Server Error during authentication",
                    details: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }
            if (!user) {
                console.log(`[Auth] Authentication failed for ${email}:`, info?.message || "Invalid email or password");
                return res.status(401).json({
                    message: info?.message || "Invalid email or password",
                    // Debug info to help troubleshoot mobile issues
                    debug: {
                        receivedEmail: email,
                        hasBody: !!req.body,
                        bodyKeys: req.body ? Object.keys(req.body) : []
                    }
                });
            }
            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error(`[Auth] Login Session Error for ${email}:`, loginErr);
                    return res.status(500).json({ message: "Failed to establish session" });
                }
                console.log(`[Auth] Session successfully created for: ${user.email}`);
                return res.status(200).json(user);
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    app.get("/api/user", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const user = await storage.getUserWithRole((req.user as User).userId);
        if (!user) return res.sendStatus(401);
        res.json(user);
    });
}
