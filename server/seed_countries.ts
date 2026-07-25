/**
 * Seed Countries and Zambian Councils
 *
 * Safe to run multiple times - uses INSERT ON CONFLICT DO NOTHING semantics.
 *
 * Countries seeded:
 *  - PNG  (Papua New Guinea) – existing tenant
 *  - ZM   (Zambia)           – new tenant
 *
 * Zambian councils seeded:
 *  - Lusaka City Council
 *  - Kitwe City Council
 *  - Ndola City Council
 */

import { db } from "./db";
import { countries, councils } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function seedCountries() {
  console.log("[seed:countries] Starting...");

  // ── Countries ──────────────────────────────────────────────────────────────
  const countryRows = [
    {
      countryCode: "PG",
      name: "Papua New Guinea",
      currency: "PGK",
      timezone: "Pacific/Port_Moresby",
      locale: "en-PG",
      flagEmoji: "🇵🇬",
      isActive: true,
    },
    {
      countryCode: "ZM",
      name: "Zambia",
      currency: "ZMW",
      timezone: "Africa/Lusaka",
      locale: "en-ZM",
      flagEmoji: "🇿🇲",
      isActive: true,
    },
  ];

  for (const row of countryRows) {
    const existing = await db
      .select()
      .from(countries)
      .where(eq(countries.countryCode, row.countryCode));

    if (existing.length === 0) {
      const [inserted] = await db.insert(countries).values(row).returning();
      console.log(`[seed:countries]  ✔ Created country: ${inserted.name} (${inserted.countryCode}) id=${inserted.countryId}`);
    } else {
      console.log(`[seed:countries]  – Skipped (exists): ${row.name} (${row.countryCode})`);
    }
  }

  // ── Fetch ZM country record ────────────────────────────────────────────────
  const [zambia] = await db
    .select()
    .from(countries)
    .where(eq(countries.countryCode, "ZM"));

  if (!zambia) {
    console.error("[seed:countries] ERROR: Zambia country record not found. Aborting council seed.");
    process.exit(1);
  }

  // ── Zambian councils ───────────────────────────────────────────────────────
  const zambianCouncils = [
    {
      name: "Lusaka City Council",
      shortName: "LCC",
      region: "Lusaka Province",
      country: "Zambia",
      address: "City Hall, Independence Avenue, Lusaka",
      phone: "+260 211 220 400",
      email: "info@lcc.gov.zm",
      website: "https://www.lcc.gov.zm",
      status: "active" as const,
    },
    {
      name: "Kitwe City Council",
      shortName: "KCC",
      region: "Copperbelt Province",
      country: "Zambia",
      address: "Civic Centre, Obote Avenue, Kitwe",
      phone: "+260 212 226 000",
      email: "info@kcc.gov.zm",
      website: "https://www.kcc.gov.zm",
      status: "active" as const,
    },
    {
      name: "Ndola City Council",
      shortName: "NCC",
      region: "Copperbelt Province",
      country: "Zambia",
      address: "City Hall, Broadway, Ndola",
      phone: "+260 212 612 345",
      email: "info@ncc.gov.zm",
      website: "https://www.ncc.gov.zm",
      status: "active" as const,
    },
  ];

  for (const council of zambianCouncils) {
    const existing = await db
      .select()
      .from(councils)
      .where(eq(councils.name, council.name));

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(councils)
        .values({ ...council, countryId: zambia.countryId })
        .returning();
      console.log(`[seed:councils]   ✔ Created council: ${inserted.name} id=${inserted.councilId}`);
    } else {
      // Ensure existing record is linked to ZM
      const c = existing[0];
      if (!c.countryId) {
        await db
          .update(councils)
          .set({ countryId: zambia.countryId })
          .where(eq(councils.councilId, c.councilId));
        console.log(`[seed:councils]   ✔ Linked existing council to ZM: ${c.name}`);
      } else {
        console.log(`[seed:councils]   – Skipped (exists): ${council.name}`);
      }
    }
  }

  // ── Link PNG councils to PNG country ──────────────────────────────────────
  const [png] = await db
    .select()
    .from(countries)
    .where(eq(countries.countryCode, "PG"));

  if (png) {
    // Update all councils that have no countryId to belong to PNG (default/legacy)
    const updateResult = await db
      .update(councils)
      .set({ countryId: png.countryId })
      .where(sql`${councils.countryId} IS NULL`);
    console.log(`[seed:countries]  ✔ Linked unscoped councils to PNG (countryId=${png.countryId})`);
  }

  console.log("[seed:countries] Done.");
}

seedCountries()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:countries] Fatal error:", err);
    process.exit(1);
  });
