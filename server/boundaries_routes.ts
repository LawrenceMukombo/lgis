import type { Express, Request, Response } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./middleware";
import { requireSuperAdmin } from "./country-middleware";

/**
 * Calculates bounding box and centroid from a GeoJSON geometry
 */
function calculateBoundsAndCentroid(geometry: any): { bbox: [number, number, number, number]; centroid: { lat: number; lng: number } } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  function traverse(coords: any) {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      sumLng += lng;
      sumLat += lat;
      count++;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  }

  if (geometry?.coordinates) {
    traverse(geometry.coordinates);
  }

  const bbox: [number, number, number, number] = [
    isFinite(minLng) ? minLng : 28.0,
    isFinite(minLat) ? minLat : -15.0,
    isFinite(maxLng) ? maxLng : 29.0,
    isFinite(maxLat) ? maxLat : -14.0,
  ];

  const centroid = {
    lng: count > 0 ? Number((sumLng / count).toFixed(6)) : Number(((bbox[0] + bbox[2]) / 2).toFixed(6)),
    lat: count > 0 ? Number((sumLat / count).toFixed(6)) : Number(((bbox[1] + bbox[3]) / 2).toFixed(6)),
  };

  return { bbox, centroid };
}

/**
 * Converts a GeoJSON Feature or FeatureCollection to a simple KML document
 */
function convertGeoJsonToKml(featureOrCollection: any, title: string = "Administrative Boundaries"): string {
  const features = featureOrCollection.type === "FeatureCollection"
    ? featureOrCollection.features || []
    : [featureOrCollection];

  let placemarks = "";
  for (const f of features) {
    const name = f.properties?.name || f.properties?.NAME_2 || f.properties?.NAME_1 || f.properties?.title || "Boundary";
    const desc = f.properties ? Object.entries(f.properties).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
    let geomXml = "";

    const geom = f.geometry;
    if (geom?.type === "Polygon") {
      const ring = geom.coordinates[0] || [];
      const coordStr = ring.map((c: any) => `${c[0]},${c[1]},0`).join(" ");
      geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordStr}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    } else if (geom?.type === "MultiPolygon") {
      const polys = geom.coordinates.map((poly: any) => {
        const ring = poly[0] || [];
        const coordStr = ring.map((c: any) => `${c[0]},${c[1]},0`).join(" ");
        return `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordStr}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
      }).join("");
      geomXml = `<MultiGeometry>${polys}</MultiGeometry>`;
    }

    placemarks += `
    <Placemark>
      <name><![CDATA[${name}]]></name>
      <description><![CDATA[${desc}]]></description>
      ${geomXml}
    </Placemark>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name><![CDATA[${title}]]></name>
    ${placemarks}
  </Document>
</kml>`;
}

export function registerBoundaryRoutes(app: Express) {
  // 1. List boundaries with full filtering, pagination, search
  app.get("/api/boundaries", async (req: Request, res: Response) => {
    try {
      const {
        countryId,
        countryCode,
        level,
        levelType,
        councilId,
        parentCode,
        parentName,
        source,
        search,
        includeGeometry = "false",
        page = "1",
        limit = "25",
        sortBy = "level",
        sortDir = "asc",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 25));
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = ["b.status = 'active'"];
      const params: any[] = [];
      let paramIdx = 1;

      if (countryId) {
        conditions.push(`b.country_id = $${paramIdx++}`);
        params.push(countryId);
      }
      if (countryCode) {
        conditions.push(`b.country_code = $${paramIdx++}`);
        params.push(countryCode);
      }
      if (level !== undefined && level !== "") {
        conditions.push(`b.level = $${paramIdx++}`);
        params.push(parseInt(level as string, 10));
      }
      if (levelType) {
        conditions.push(`b.level_type = $${paramIdx++}`);
        params.push(levelType);
      }
      if (councilId) {
        conditions.push(`b.council_id = $${paramIdx++}`);
        params.push(councilId);
      }
      if (parentCode) {
        conditions.push(`b.parent_code = $${paramIdx++}`);
        params.push(parentCode);
      }
      if (parentName) {
        conditions.push(`b.parent_name ILIKE $${paramIdx++}`);
        params.push(`%${parentName}%`);
      }
      if (source) {
        conditions.push(`b.source = $${paramIdx++}`);
        params.push(source);
      }
      if (search) {
        conditions.push(`(b.name ILIKE $${paramIdx} OR b.code ILIKE $${paramIdx} OR b.parent_name ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Count query
      const countRes = await pool.query(
        `SELECT COUNT(*)::int as total FROM administrative_boundaries b ${whereClause}`,
        params
      );
      const total = countRes.rows[0]?.total || 0;

      // Select fields (omit coordinates if includeGeometry is false for speed)
      const selectFields = includeGeometry === "true"
        ? `b.boundary_id, b.country_id, b.country_code, b.level, b.level_type, b.name, b.code, b.parent_code, b.parent_name, b.council_id, b.source, b.source_url, b.geometry_type, b.coordinates, b.centroid, b.bounding_box, b.area_km2, b.properties, b.status, b.created_at, b.updated_at, c.name as council_name`
        : `b.boundary_id, b.country_id, b.country_code, b.level, b.level_type, b.name, b.code, b.parent_code, b.parent_name, b.council_id, b.source, b.source_url, b.geometry_type, b.centroid, b.bounding_box, b.area_km2, b.status, b.created_at, b.updated_at, c.name as council_name`;

      // Order by
      const validSortCols: Record<string, string> = {
        level: "b.level",
        name: "b.name",
        levelType: "b.level_type",
        parentName: "b.parent_name",
        source: "b.source",
        createdAt: "b.created_at",
      };
      const orderCol = validSortCols[sortBy as string] || "b.level";
      const orderDir = (sortDir as string).toLowerCase() === "desc" ? "DESC" : "ASC";

      const listQuery = `
        SELECT ${selectFields}
        FROM administrative_boundaries b
        LEFT JOIN councils c ON b.council_id = c.council_id
        ${whereClause}
        ORDER BY ${orderCol} ${orderDir}, b.name ASC
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}
      `;
      params.push(limitNum, offset);

      const listRes = await pool.query(listQuery, params);

      res.json({
        boundaries: listRes.rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum,
      });
    } catch (err: any) {
      console.error("[GET /api/boundaries] Error:", err);
      res.status(500).json({ error: "Failed to fetch administrative boundaries", details: err.message });
    }
  });

  // 1b. Dataset summary per country tier (as seen in VaxPlan Loaded Boundary Datasets card)
  app.get("/api/boundaries/datasets-summary", async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.query.countryCode as string) || "ZM").toUpperCase();

      const iso3Map: Record<string, string> = {
        ZM: "ZMB",
        PG: "PNG",
        KE: "KEN",
        UG: "UGA",
        TZ: "TZA",
        MW: "MWI",
        RW: "RWA",
        ZW: "ZWE",
      };
      const iso3 = iso3Map[countryCode] || countryCode;

      // Group active boundaries by level
      const summaryRes = await pool.query(
        `SELECT 
          b.level,
          b.level_type,
          b.country_code,
          COUNT(*)::int as feature_count,
          MAX(b.updated_at) as updated_at,
          MODE() WITHIN GROUP (ORDER BY b.source) as primary_source
        FROM administrative_boundaries b
        WHERE b.country_code = $1 AND b.status = 'active'
        GROUP BY b.level, b.level_type, b.country_code
        ORDER BY b.level ASC`,
        [countryCode]
      );

      // Map level names cleanly
      const levelNameMap: Record<number, { name: string; type: string }> = {
        0: { name: "Country", type: "country" },
        1: { name: "Province", type: "province" },
        2: { name: "District", type: "district" },
        3: { name: "Ward", type: "ward" },
        4: { name: "Sub-Ward", type: "sub-ward" },
      };

      const datasets = summaryRes.rows.map(row => {
        const lvl = row.level;
        const config = levelNameMap[lvl] || { name: `Level ${lvl}`, type: row.level_type };
        return {
          level: lvl,
          levelBadge: `L${lvl}`,
          name: config.name,
          levelType: row.level_type || config.type,
          countryCode: row.country_code,
          iso3,
          featureCount: row.feature_count,
          source: row.primary_source || "GeoBoundaries API",
          status: "Active",
          updatedAt: row.updated_at,
        };
      });

      res.json({
        countryCode,
        iso3,
        totalDatasets: datasets.length,
        datasets,
      });
    } catch (err: any) {
      console.error("[GET /api/boundaries/datasets-summary] Error:", err);
      res.status(500).json({ error: "Failed to get boundary datasets summary", details: err.message });
    }
  });

  // 1c. Export all boundaries for a specific level (L1, L2, L3)
  app.get("/api/boundaries/export-level", async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.query.countryCode as string) || "ZM").toUpperCase();
      const level = parseInt((req.query.level as string) || "1", 10);
      const format = ((req.query.format as string) || "geojson").toLowerCase();

      const result = await pool.query(
        `SELECT * FROM administrative_boundaries 
         WHERE country_code = $1 AND level = $2 AND status = 'active'
         ORDER BY name ASC`,
        [countryCode, level]
      );

      const features = result.rows.map(b => ({
        type: "Feature",
        id: b.boundary_id,
        geometry: {
          type: b.geometry_type || "Polygon",
          coordinates: b.coordinates,
        },
        properties: {
          boundaryId: b.boundary_id,
          name: b.name,
          level: b.level,
          levelType: b.level_type,
          code: b.code,
          parentName: b.parent_name,
          countryCode: b.country_code,
          centroid: b.centroid,
          boundingBox: b.bounding_box,
          source: b.source,
          ...(b.properties || {}),
        },
      }));

      const collection = {
        type: "FeatureCollection",
        metadata: {
          countryCode,
          level,
          levelType: result.rows[0]?.level_type || `Level ${level}`,
          featureCount: features.length,
          exportedAt: new Date().toISOString(),
        },
        features,
      };

      const levelTypeName = result.rows[0]?.level_type || `level${level}`;
      const filename = `${countryCode}_${levelTypeName}_L${level}`;

      if (format === "kml") {
        const kmlContent = convertGeoJsonToKml(collection, `${countryCode} Level ${level} Boundaries`);
        res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.kml"`);
        return res.send(kmlContent);
      }

      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.geojson"`);
      return res.json(collection);
    } catch (err: any) {
      console.error("[GET /api/boundaries/export-level] Error:", err);
      res.status(500).json({ error: "Failed to export level boundaries", details: err.message });
    }
  });

  // 2. Get single boundary by ID (with full geometry)
  app.get("/api/boundaries/:boundaryId", async (req: Request, res: Response) => {
    try {
      const { boundaryId } = req.params;
      const result = await pool.query(
        `SELECT b.*, c.name as council_name, cnt.name as country_name 
         FROM administrative_boundaries b
         LEFT JOIN councils c ON b.council_id = c.council_id
         LEFT JOIN countries cnt ON b.country_id = cnt.country_id
         WHERE b.boundary_id = $1`,
        [boundaryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Boundary not found" });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      console.error("[GET /api/boundaries/:id] Error:", err);
      res.status(500).json({ error: "Failed to fetch boundary", details: err.message });
    }
  });

  // 3. Download single boundary file (GeoJSON or KML)
  app.get("/api/boundaries/:boundaryId/download", async (req: Request, res: Response) => {
    try {
      const { boundaryId } = req.params;
      const format = ((req.query.format as string) || "geojson").toLowerCase();

      const result = await pool.query(
        `SELECT * FROM administrative_boundaries WHERE boundary_id = $1`,
        [boundaryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Boundary not found" });
      }

      const b = result.rows[0];
      const safeName = (b.name || "boundary").replace(/[^a-zA-Z0-9_-]/g, "_");

      const feature = {
        type: "Feature",
        id: b.boundary_id,
        geometry: {
          type: b.geometry_type || "Polygon",
          coordinates: b.coordinates,
        },
        properties: {
          boundaryId: b.boundary_id,
          name: b.name,
          level: b.level,
          levelType: b.level_type,
          code: b.code,
          parentCode: b.parent_code,
          parentName: b.parent_name,
          countryCode: b.country_code,
          areaKm2: b.area_km2,
          centroid: b.centroid,
          boundingBox: b.bounding_box,
          source: b.source,
          ...(b.properties || {}),
        },
      };

      if (format === "kml") {
        const kmlContent = convertGeoJsonToKml(feature, b.name);
        res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}_level${b.level}.kml"`);
        return res.send(kmlContent);
      }

      // Default: GeoJSON
      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}_level${b.level}.geojson"`);
      return res.json(feature);
    } catch (err: any) {
      console.error("[GET /api/boundaries/:id/download] Error:", err);
      res.status(500).json({ error: "Failed to download boundary", details: err.message });
    }
  });

  // 4. Get lowest level boundary for a council (Ward L3 if available, otherwise District L2)
  app.get("/api/councils/:councilId/lowest-boundary", async (req: Request, res: Response) => {
    try {
      const { councilId } = req.params;
      const format = ((req.query.format as string) || "geojson").toLowerCase();
      const download = req.query.download === "true";

      // Fetch council details
      const councilRes = await pool.query(
        `SELECT c.*, cnt.name as country_name FROM councils c 
         LEFT JOIN countries cnt ON c.country_id = cnt.country_id 
         WHERE c.council_id = $1`,
        [councilId]
      );
      if (councilRes.rows.length === 0) {
        return res.status(404).json({ error: "Council not found" });
      }
      const council = councilRes.rows[0];

      // Check for Level 3 (ward) boundaries under this council
      const wardRes = await pool.query(
        `SELECT * FROM administrative_boundaries 
         WHERE council_id = $1 AND level = 3 AND status = 'active'
         ORDER BY name ASC`,
        [councilId]
      );

      let lowestLevel = "district";
      let lowestLevelNumber = 2;
      let boundariesToReturn: any[] = [];

      if (wardRes.rows.length > 0) {
        lowestLevel = "ward";
        lowestLevelNumber = 3;
        boundariesToReturn = wardRes.rows;
      } else {
        // Fall back to Level 2 (district/council) boundary
        const districtRes = await pool.query(
          `SELECT * FROM administrative_boundaries 
           WHERE (council_id = $1 OR name ILIKE $2) AND level = 2 AND status = 'active'
           LIMIT 1`,
          [councilId, `%${council.name.replace(/council|city|municipal|town/gi, "").trim()}%`]
        );
        if (districtRes.rows.length > 0) {
          boundariesToReturn = districtRes.rows;
        }
      }

      const features = boundariesToReturn.map((b) => ({
        type: "Feature",
        id: b.boundary_id,
        geometry: {
          type: b.geometry_type || "Polygon",
          coordinates: b.coordinates,
        },
        properties: {
          boundaryId: b.boundary_id,
          name: b.name,
          level: b.level,
          levelType: b.level_type,
          code: b.code,
          councilId: council.council_id,
          councilName: council.name,
          countryCode: council.country_code,
          centroid: b.centroid,
          boundingBox: b.bounding_box,
          areaKm2: b.area_km2,
          lowestLevelAvailable: lowestLevel,
          source: b.source,
          ...(b.properties || {}),
        },
      }));

      const featureCollection = {
        type: "FeatureCollection",
        metadata: {
          councilId: council.council_id,
          councilName: council.name,
          lowestLevel,
          lowestLevelNumber,
          featureCount: features.length,
          generatedAt: new Date().toISOString(),
        },
        features,
      };

      const safeCouncilName = council.name.replace(/[^a-zA-Z0-9_-]/g, "_");

      if (download || format === "kml") {
        if (format === "kml") {
          const kmlContent = convertGeoJsonToKml(featureCollection, `${council.name} - ${lowestLevel} Boundaries`);
          res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
          res.setHeader("Content-Disposition", `attachment; filename="${safeCouncilName}_${lowestLevel}_boundaries.kml"`);
          return res.send(kmlContent);
        }

        res.setHeader("Content-Type", "application/geo+json");
        res.setHeader("Content-Disposition", `attachment; filename="${safeCouncilName}_${lowestLevel}_boundaries.geojson"`);
        return res.json(featureCollection);
      }

      return res.json(featureCollection);
    } catch (err: any) {
      console.error("[GET /api/councils/:id/lowest-boundary] Error:", err);
      res.status(500).json({ error: "Failed to resolve council lowest-level boundary", details: err.message });
    }
  });

  // 5. Bulk Export lowest-level boundaries for ALL councils of a country
  app.get("/api/countries/:countryId/councils/lowest-boundaries-export", async (req: Request, res: Response) => {
    try {
      const { countryId } = req.params;
      const format = ((req.query.format as string) || "geojson").toLowerCase();

      // Verify country
      const countryRes = await pool.query(`SELECT * FROM countries WHERE country_id = $1`, [countryId]);
      if (countryRes.rows.length === 0) {
        return res.status(404).json({ error: "Country not found" });
      }
      const country = countryRes.rows[0];

      // Fetch all councils for this country
      const councilsRes = await pool.query(
        `SELECT council_id, name, level, country_code FROM councils WHERE country_id = $1 ORDER BY name ASC`,
        [countryId]
      );
      const allCouncils = councilsRes.rows;

      // For each council, check if wards exist, else take level 2
      const allFeatures: any[] = [];
      let totalWards = 0;
      let totalDistricts = 0;

      for (const c of allCouncils) {
        const wards = await pool.query(
          `SELECT * FROM administrative_boundaries WHERE council_id = $1 AND level = 3 AND status = 'active'`,
          [c.council_id]
        );

        if (wards.rows.length > 0) {
          totalWards += wards.rows.length;
          for (const w of wards.rows) {
            allFeatures.push({
              type: "Feature",
              id: w.boundary_id,
              geometry: { type: w.geometry_type || "Polygon", coordinates: w.coordinates },
              properties: {
                boundaryId: w.boundary_id,
                name: w.name,
                level: 3,
                levelType: "ward",
                councilId: c.council_id,
                councilName: c.name,
                countryCode: country.country_code,
                centroid: w.centroid,
                boundingBox: w.bounding_box,
                source: w.source,
              },
            });
          }
        } else {
          // Use council district boundary
          const district = await pool.query(
            `SELECT * FROM administrative_boundaries 
             WHERE (council_id = $1 OR name ILIKE $2) AND level = 2 AND status = 'active' LIMIT 1`,
            [c.council_id, `%${c.name.replace(/council|city|municipal|town/gi, "").trim()}%`]
          );
          if (district.rows.length > 0) {
            const d = district.rows[0];
            totalDistricts++;
            allFeatures.push({
              type: "Feature",
              id: d.boundary_id,
              geometry: { type: d.geometry_type || "Polygon", coordinates: d.coordinates },
              properties: {
                boundaryId: d.boundary_id,
                name: d.name,
                level: 2,
                levelType: "district",
                councilId: c.council_id,
                councilName: c.name,
                countryCode: country.country_code,
                centroid: d.centroid,
                boundingBox: d.bounding_box,
                source: d.source,
              },
            });
          }
        }
      }

      const collection = {
        type: "FeatureCollection",
        metadata: {
          countryId: country.country_id,
          countryName: country.name,
          countryCode: country.country_code,
          totalCouncils: allCouncils.length,
          totalFeatures: allFeatures.length,
          districtsExported: totalDistricts,
          wardsExported: totalWards,
          exportedAt: new Date().toISOString(),
        },
        features: allFeatures,
      };

      const safeCountry = country.name.replace(/[^a-zA-Z0-9_-]/g, "_");

      if (format === "kml") {
        const kmlContent = convertGeoJsonToKml(collection, `${country.name} Councils Lowest-Level Boundaries`);
        res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
        res.setHeader("Content-Disposition", `attachment; filename="${safeCountry}_all_councils_lowest_boundaries.kml"`);
        return res.send(kmlContent);
      }

      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader("Content-Disposition", `attachment; filename="${safeCountry}_all_councils_lowest_boundaries.geojson"`);
      return res.json(collection);
    } catch (err: any) {
      console.error("[GET /api/countries/:id/councils/lowest-boundaries-export] Error:", err);
      res.status(500).json({ error: "Failed to export lowest-level boundaries", details: err.message });
    }
  });

  // 6. Create or add custom boundary
  app.post("/api/boundaries", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        countryId,
        countryCode = "ZM",
        level = 3,
        levelType = "ward",
        name,
        code,
        parentCode,
        parentName,
        councilId,
        coordinates,
        geometryType = "Polygon",
        source = "CUSTOM",
        properties = {},
      } = req.body;

      if (!name || !coordinates) {
        return res.status(400).json({ error: "Name and coordinates are required" });
      }

      const { bbox, centroid } = calculateBoundsAndCentroid({ coordinates, type: geometryType });

      const insertRes = await pool.query(
        `INSERT INTO administrative_boundaries (
          country_id, country_code, level, level_type, name, code, parent_code, parent_name,
          council_id, source, geometry_type, coordinates, centroid, bounding_box, properties, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active')
        RETURNING *`,
        [
          countryId || null,
          countryCode,
          parseInt(level, 10),
          levelType,
          name,
          code || null,
          parentCode || null,
          parentName || null,
          councilId || null,
          source,
          geometryType,
          JSON.stringify(coordinates),
          JSON.stringify(centroid),
          JSON.stringify(bbox),
          JSON.stringify(properties),
        ]
      );

      res.status(201).json(insertRes.rows[0]);
    } catch (err: any) {
      console.error("[POST /api/boundaries] Error:", err);
      res.status(500).json({ error: "Failed to create boundary", details: err.message });
    }
  });

  // 7. Upload custom GeoJSON / Shapefile features (supports bulk upload)
  app.post("/api/boundaries/upload", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        countryId,
        countryCode = "ZM",
        councilId,
        level = 3,
        levelType = "ward",
        parentName,
        geojson,
      } = req.body;

      if (!geojson) {
        return res.status(400).json({ error: "GeoJSON payload is required" });
      }

      let parsed = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
      let features: any[] = [];

      if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
        features = parsed.features;
      } else if (parsed.type === "Feature") {
        features = [parsed];
      } else if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") {
        features = [{ type: "Feature", geometry: parsed, properties: { name: req.body.name || "Custom Boundary" } }];
      } else {
        return res.status(400).json({ error: "Invalid GeoJSON structure. Must be FeatureCollection, Feature, or Geometry." });
      }

      let importedCount = 0;
      for (const feat of features) {
        if (!feat.geometry?.coordinates) continue;

        const p = feat.properties || {};
        const featName = p.name || p.NAME || p.NAME_3 || p.NAME_2 || p.WARD_NAME || p.DISTRICT || `Boundary ${importedCount + 1}`;
        const featCode = p.code || p.CODE || p.GID_3 || p.GID_2 || null;
        const geomType = feat.geometry.type || "Polygon";
        const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);

        await pool.query(
          `INSERT INTO administrative_boundaries (
            country_id, country_code, level, level_type, name, code, parent_code, parent_name,
            council_id, source, geometry_type, coordinates, centroid, bounding_box, properties, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UPLOAD', $10, $11, $12, $13, $14, 'active')`,
          [
            countryId || null,
            countryCode,
            parseInt(level as any, 10),
            levelType,
            featName,
            featCode,
            p.parentCode || null,
            parentName || p.parentName || p.PROVINCE || null,
            councilId || null,
            geomType,
            JSON.stringify(feat.geometry.coordinates),
            JSON.stringify(centroid),
            JSON.stringify(bbox),
            JSON.stringify(p),
          ]
        );
        importedCount++;
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedCount} boundary feature(s)`,
        count: importedCount,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/upload] Error:", err);
      res.status(500).json({ error: "Failed to upload and import boundary features", details: err.message });
    }
  });

  // 8. Import from GitHub raw URL or any external GeoJSON URL
  app.post("/api/boundaries/import-url", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        url,
        countryId,
        countryCode = "ZM",
        councilId,
        level = 3,
        levelType = "ward",
        parentName,
      } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`[boundaries/import-url] Fetching external GeoJSON from ${url}...`);
      const response = await fetch(url, { headers: { "User-Agent": "LGIS-Boundary-Importer" } });
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}` });
      }

      const rawText = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (jsonErr: any) {
        return res.status(400).json({ error: "The URL did not return valid JSON or GeoJSON content." });
      }

      let features: any[] = [];
      if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
        features = parsed.features;
      } else if (parsed.type === "Feature") {
        features = [parsed];
      } else if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") {
        features = [{ type: "Feature", geometry: parsed, properties: { name: "Imported Boundary" } }];
      } else {
        return res.status(400).json({ error: "Invalid GeoJSON structure from URL." });
      }

      let importedCount = 0;
      for (const feat of features) {
        if (!feat.geometry?.coordinates) continue;

        const p = feat.properties || {};
        const featName = p.name || p.NAME || p.NAME_3 || p.NAME_2 || p.WARD_NAME || p.DISTRICT || `Imported Feature ${importedCount + 1}`;
        const featCode = p.code || p.CODE || p.GID_3 || p.GID_2 || null;
        const geomType = feat.geometry.type || "Polygon";
        const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);

        await pool.query(
          `INSERT INTO administrative_boundaries (
            country_id, country_code, level, level_type, name, code, parent_code, parent_name,
            council_id, source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'GITHUB', $10, $11, $12, $13, $14, $15, 'active')`,
          [
            countryId || null,
            countryCode,
            parseInt(level as any, 10),
            levelType,
            featName,
            featCode,
            p.parentCode || null,
            parentName || p.parentName || p.PROVINCE || null,
            councilId || null,
            url,
            geomType,
            JSON.stringify(feat.geometry.coordinates),
            JSON.stringify(centroid),
            JSON.stringify(bbox),
            JSON.stringify(p),
          ]
        );
        importedCount++;
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedCount} boundary feature(s) from external URL`,
        count: importedCount,
        sourceUrl: url,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/import-url] Error:", err);
      res.status(500).json({ error: "Failed to import boundaries from URL", details: err.message });
    }
  });

  // 9. Sync official GADM boundaries on demand for a country
  app.post("/api/boundaries/sync-gadm", isAuthenticated, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.body.countryCode as string) || "ZM").toUpperCase();
      const countryId = req.body.countryId;

      // Find country ID if not provided
      let targetCountryId = countryId;
      if (!targetCountryId) {
        const cRes = await pool.query(`SELECT country_id FROM countries WHERE country_code = $1 LIMIT 1`, [countryCode]);
        if (cRes.rows.length > 0) {
          targetCountryId = cRes.rows[0].country_id;
        }
      }

      const gadmCountryCode = countryCode === "ZM" ? "ZMB" : countryCode === "PG" ? "PNG" : countryCode;

      let syncedLevels: Record<string, number> = {};

      // 1. Sync Level 1 (Provinces)
      try {
        const resL1 = await fetch(`https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${gadmCountryCode}_1.json`);
        if (resL1.ok) {
          const dataL1 = await resL1.json();
          let count = 0;
          for (const feat of dataL1.features || []) {
            const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);
            const provName = feat.properties.NAME_1;
            const provGid = feat.properties.GID_1;

            const existing = await pool.query(
              `SELECT boundary_id FROM administrative_boundaries WHERE country_code = $1 AND level = 1 AND code = $2`,
              [countryCode, provGid]
            );

            if (existing.rows.length === 0) {
              await pool.query(
                `INSERT INTO administrative_boundaries (
                  country_id, country_code, level, level_type, name, code, parent_code, parent_name,
                  source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
                ) VALUES ($1, $2, 1, 'province', $3, $4, $5, 'National', 'GADM', $6, $7, $8, $9, $10, $11, 'active')`,
                [
                  targetCountryId || null,
                  countryCode,
                  provName,
                  provGid,
                  gadmCountryCode,
                  `https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${gadmCountryCode}_1.json`,
                  feat.geometry.type,
                  JSON.stringify(feat.geometry.coordinates),
                  JSON.stringify(centroid),
                  JSON.stringify(bbox),
                  JSON.stringify(feat.properties),
                ]
              );
              count++;
            }
          }
          syncedLevels["level1"] = count;
        }
      } catch (errL1: any) {
        console.warn("[sync-gadm] Level 1 notice:", errL1.message);
      }

      // 2. Sync Level 2 (Districts)
      try {
        const resL2 = await fetch(`https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${gadmCountryCode}_2.json`);
        if (resL2.ok) {
          const dataL2 = await resL2.json();
          let count = 0;
          for (const feat of dataL2.features || []) {
            const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);
            const distName = feat.properties.NAME_2;
            const gid2 = feat.properties.GID_2;
            const gid1 = feat.properties.GID_1;

            const existing = await pool.query(
              `SELECT boundary_id FROM administrative_boundaries WHERE country_code = $1 AND level = 2 AND code = $2`,
              [countryCode, gid2]
            );

            if (existing.rows.length === 0) {
              await pool.query(
                `INSERT INTO administrative_boundaries (
                  country_id, country_code, level, level_type, name, code, parent_code, parent_name,
                  source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
                ) VALUES ($1, $2, 2, 'district', $3, $4, $5, $6, 'GADM', $7, $8, $9, $10, $11, $12, 'active')`,
                [
                  targetCountryId || null,
                  countryCode,
                  distName,
                  gid2,
                  gid1,
                  feat.properties.NAME_1 || "Province",
                  `https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${gadmCountryCode}_2.json`,
                  feat.geometry.type,
                  JSON.stringify(feat.geometry.coordinates),
                  JSON.stringify(centroid),
                  JSON.stringify(bbox),
                  JSON.stringify(feat.properties),
                ]
              );
              count++;
            }
          }
          syncedLevels["level2"] = count;
        }
      } catch (errL2: any) {
        console.warn("[sync-gadm] Level 2 notice:", errL2.message);
      }

      res.json({
        success: true,
        message: `GADM sync completed for country ${countryCode}`,
        synced: syncedLevels,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/sync-gadm] Error:", err);
      res.status(500).json({ error: "Failed to sync GADM boundaries", details: err.message });
    }
  });

  // 9b. Sync official GeoBoundaries API datasets on demand
  app.post("/api/boundaries/sync-geoboundaries", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.body.countryCode as string) || "ZM").toUpperCase();
      const requestedLevel = (req.body.level as string) || "ALL"; // 'ADM1', 'ADM2', 'ADM3', 'ALL'
      const countryId = req.body.countryId;

      let targetCountryId = countryId;
      if (!targetCountryId) {
        const cRes = await pool.query(`SELECT country_id FROM countries WHERE country_code = $1 LIMIT 1`, [countryCode]);
        if (cRes.rows.length > 0) {
          targetCountryId = cRes.rows[0].country_id;
        }
      }

      // ISO-2 to ISO-3 map
      const iso3Map: Record<string, string> = {
        ZM: "ZMB",
        PG: "PNG",
        KE: "KEN",
        UG: "UGA",
        TZ: "TZA",
        MW: "MWI",
        RW: "RWA",
        ZW: "ZWE",
        CD: "COD",
        AO: "AGO",
        MZ: "MOZ",
        BW: "BWA",
        NA: "NAM",
        ZA: "ZAF",
      };
      const iso3 = iso3Map[countryCode] || (countryCode.length === 3 ? countryCode : "ZMB");

      const levelsToSync: { adm: string; num: number; type: string }[] = [];
      if (requestedLevel === "ALL" || requestedLevel === "ADM1") {
        levelsToSync.push({ adm: "ADM1", num: 1, type: "province" });
      }
      if (requestedLevel === "ALL" || requestedLevel === "ADM2") {
        levelsToSync.push({ adm: "ADM2", num: 2, type: "district" });
      }
      if (requestedLevel === "ALL" || requestedLevel === "ADM3") {
        levelsToSync.push({ adm: "ADM3", num: 3, type: "ward" });
      }

      const results: Record<string, { status: string; count: number; error?: string }> = {};

      for (const item of levelsToSync) {
        try {
          const apiUrl = `https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${item.adm}/`;
          console.log(`[sync-geoboundaries] Querying ${apiUrl}...`);
          const metaRes = await fetch(apiUrl, { headers: { "User-Agent": "LGIS-GeoBoundaries-Client" } });

          if (!metaRes.ok) {
            results[item.adm] = {
              status: "skipped",
              count: 0,
              error: `API returned HTTP ${metaRes.status} (level may not exist in GeoBoundaries open dataset)`,
            };
            continue;
          }

          const meta = await metaRes.json();
          const downloadUrl = meta.gjDownloadURL || meta.staticDownloadLink;
          if (!downloadUrl) {
            results[item.adm] = { status: "failed", count: 0, error: "No download URL returned by GeoBoundaries" };
            continue;
          }

          console.log(`[sync-geoboundaries] Downloading GeoJSON from ${downloadUrl}...`);
          const geoRes = await fetch(downloadUrl, { headers: { "User-Agent": "LGIS-GeoBoundaries-Client" } });
          if (!geoRes.ok) {
            results[item.adm] = { status: "failed", count: 0, error: `Failed to download GeoJSON: HTTP ${geoRes.status}` };
            continue;
          }

          const geoData = await geoRes.json();
          const features = geoData.features || [];
          let insertedOrUpdated = 0;

          for (const feat of features) {
            if (!feat.geometry?.coordinates) continue;
            const p = feat.properties || {};
            const featName = p.shapeName || p.shapeGroup || p.shapeName_1 || p.shapeName_2 || p.name || p.NAME || `Feature ${insertedOrUpdated + 1}`;
            const featCode = p.shapeID || p.shapeISO || p.shapeGroup || null;
            const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);

            // Check if boundary exists by code or name
            let councilId = null;
            if (item.num === 2) {
              const cleanName = featName.replace(/council|city|municipal|town|district/gi, "").trim();
              const cMatch = await pool.query(
                `SELECT council_id FROM councils WHERE country_code = $1 AND name ILIKE $2 LIMIT 1`,
                [countryCode, `%${cleanName}%`]
              );
              if (cMatch.rows.length > 0) {
                councilId = cMatch.rows[0].council_id;
              }
            }

            const existing = await pool.query(
              `SELECT boundary_id FROM administrative_boundaries 
               WHERE country_code = $1 AND level = $2 AND (code = $3 OR name ILIKE $4) AND status = 'active' LIMIT 1`,
              [countryCode, item.num, featCode, featName]
            );

            if (existing.rows.length > 0) {
              await pool.query(
                `UPDATE administrative_boundaries SET
                  geometry_type = $1,
                  coordinates = $2,
                  centroid = $3,
                  bounding_box = $4,
                  source = 'GeoBoundaries API',
                  source_url = $5,
                  properties = $6,
                  council_id = COALESCE(council_id, $7),
                  updated_at = now()
                WHERE boundary_id = $8`,
                [
                  feat.geometry.type,
                  JSON.stringify(feat.geometry.coordinates),
                  JSON.stringify(centroid),
                  JSON.stringify(bbox),
                  downloadUrl,
                  JSON.stringify(p),
                  councilId,
                  existing.rows[0].boundary_id,
                ]
              );
            } else {
              await pool.query(
                `INSERT INTO administrative_boundaries (
                  country_id, country_code, level, level_type, name, code, parent_code, parent_name,
                  council_id, source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'GeoBoundaries API', $10, $11, $12, $13, $14, $15, 'active')`,
                [
                  targetCountryId || null,
                  countryCode,
                  item.num,
                  item.type,
                  featName,
                  featCode,
                  p.shapeGroup || null,
                  p.shapeGroup || null,
                  councilId,
                  downloadUrl,
                  feat.geometry.type,
                  JSON.stringify(feat.geometry.coordinates),
                  JSON.stringify(centroid),
                  JSON.stringify(bbox),
                  JSON.stringify(p),
                ]
              );
            }
            insertedOrUpdated++;
          }

          results[item.adm] = {
            status: "success",
            count: insertedOrUpdated,
          };
        } catch (itemErr: any) {
          console.error(`[sync-geoboundaries] Error on ${item.adm}:`, itemErr);
          results[item.adm] = { status: "failed", count: 0, error: itemErr.message };
        }
      }

      res.json({
        success: true,
        countryCode,
        iso3,
        results,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/sync-geoboundaries] Error:", err);
      res.status(500).json({ error: "Failed to sync GeoBoundaries", details: err.message });
    }
  });

  // 9e. Upload Headquarters CSV (Upload HQ CSV)
  app.post("/api/boundaries/upload-hq-csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { csvContent, countryCode = "ZM", level = 2 } = req.body;

      if (!csvContent || typeof csvContent !== "string") {
        return res.status(400).json({ error: "csvContent string is required" });
      }

      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV must contain at least a header and one data row" });
      }

      const headerLine = lines[0];
      const headers = headerLine.split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

      // Column index matching
      const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("council") || h.includes("district"));
      const codeIdx = headers.findIndex(h => h.includes("code") || h.includes("id"));
      const latIdx = headers.findIndex(h => h.includes("lat") || h.includes("y"));
      const lngIdx = headers.findIndex(h => h.includes("lng") || h.includes("lon") || h.includes("x"));
      const addrIdx = headers.findIndex(h => h.includes("address") || h.includes("location"));
      const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("tel"));
      const emailIdx = headers.findIndex(h => h.includes("email"));

      if (nameIdx === -1) {
        return res.status(400).json({ error: "CSV must contain a 'name' or 'council' column" });
      }

      let updatedCount = 0;
      let createdPoints = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
        const nameVal = row[nameIdx];
        if (!nameVal) continue;

        const codeVal = codeIdx !== -1 ? row[codeIdx] : null;
        const latVal = latIdx !== -1 ? parseFloat(row[latIdx]) : NaN;
        const lngVal = lngIdx !== -1 ? parseFloat(row[lngIdx]) : NaN;
        const addrVal = addrIdx !== -1 ? row[addrIdx] : null;
        const phoneVal = phoneIdx !== -1 ? row[phoneIdx] : null;
        const emailVal = emailIdx !== -1 ? row[emailIdx] : null;

        // Try updating council if exists
        const cleanName = nameVal.replace(/council|city|municipal|town|district/gi, "").trim();
        const councilMatch = await pool.query(
          `SELECT council_id FROM councils WHERE country_code = $1 AND name ILIKE $2 LIMIT 1`,
          [countryCode, `%${cleanName}%`]
        );

        if (councilMatch.rows.length > 0) {
          const cId = councilMatch.rows[0].council_id;
          const updates: string[] = [];
          const params: any[] = [cId];
          let pIdx = 2;

          if (!isNaN(latVal) && !isNaN(lngVal)) {
            updates.push(`latitude = $${pIdx++}`, `longitude = $${pIdx++}`);
            params.push(latVal, lngVal);
          }
          if (addrVal) {
            updates.push(`contact_address = $${pIdx++}`);
            params.push(addrVal);
          }
          if (phoneVal) {
            updates.push(`contact_phone = $${pIdx++}`);
            params.push(phoneVal);
          }
          if (emailVal) {
            updates.push(`contact_email = $${pIdx++}`);
            params.push(emailVal);
          }

          if (updates.length > 0) {
            await pool.query(
              `UPDATE councils SET ${updates.join(", ")}, updated_at = now() WHERE council_id = $1`,
              params
            );
            updatedCount++;
          }
        }

        // Also update boundary centroid if coordinates provided
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          const bMatch = await pool.query(
            `UPDATE administrative_boundaries SET
              centroid = $1,
              updated_at = now()
             WHERE country_code = $2 AND name ILIKE $3 AND status = 'active' RETURNING boundary_id`,
            [JSON.stringify({ lat: latVal, lng: lngVal }), countryCode, `%${cleanName}%`]
          );
          if (bMatch.rows.length > 0) {
            createdPoints++;
          }
        }
      }

      res.json({
        success: true,
        message: `Processed HQ CSV: Updated ${updatedCount} council(s) and set ${createdPoints} headquarters coordinate centroid(s).`,
        councilsUpdated: updatedCount,
        centroidsUpdated: createdPoints,
        totalRows: lines.length - 1,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/upload-hq-csv] Error:", err);
      res.status(500).json({ error: "Failed to process HQ CSV", details: err.message });
    }
  });

  // 9f. Clear / Archive an entire administrative boundary level (Replace flow)
  app.post("/api/boundaries/clear-level", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.body.countryCode as string) || "ZM").toUpperCase();
      const level = parseInt(req.body.level, 10);

      if (isNaN(level)) {
        return res.status(400).json({ error: "Valid level number is required" });
      }

      // Safe soft-archive
      const result = await pool.query(
        `UPDATE administrative_boundaries 
         SET status = 'archived', updated_at = now()
         WHERE country_code = $1 AND level = $2 AND status = 'active'
         RETURNING boundary_id`,
        [countryCode, level]
      );

      res.json({
        success: true,
        message: `Archived ${result.rows.length} boundary features for level ${level} in ${countryCode}`,
        archivedCount: result.rows.length,
      });
    } catch (err: any) {
      console.error("[POST /api/boundaries/clear-level] Error:", err);
      res.status(500).json({ error: "Failed to clear boundary level", details: err.message });
    }
  });

  // 10. Update boundary metadata
  app.patch("/api/boundaries/:boundaryId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { boundaryId } = req.params;
      const { name, levelType, status, properties, councilId } = req.body;

      const updates: string[] = ["updated_at = now()"];
      const params: any[] = [boundaryId];
      let pIdx = 2;

      if (name !== undefined) {
        updates.push(`name = $${pIdx++}`);
        params.push(name);
      }
      if (levelType !== undefined) {
        updates.push(`level_type = $${pIdx++}`);
        params.push(levelType);
      }
      if (status !== undefined) {
        updates.push(`status = $${pIdx++}`);
        params.push(status);
      }
      if (councilId !== undefined) {
        updates.push(`council_id = $${pIdx++}`);
        params.push(councilId || null);
      }
      if (properties !== undefined) {
        updates.push(`properties = $${pIdx++}`);
        params.push(JSON.stringify(properties));
      }

      const updateRes = await pool.query(
        `UPDATE administrative_boundaries SET ${updates.join(", ")} WHERE boundary_id = $1 RETURNING *`,
        params
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: "Boundary not found" });
      }

      res.json(updateRes.rows[0]);
    } catch (err: any) {
      console.error("[PATCH /api/boundaries/:id] Error:", err);
      res.status(500).json({ error: "Failed to update boundary", details: err.message });
    }
  });

  // 11. Delete boundary (soft-delete or archive)
  app.delete("/api/boundaries/:boundaryId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { boundaryId } = req.params;
      const result = await pool.query(
        `UPDATE administrative_boundaries SET status = 'archived', updated_at = now() WHERE boundary_id = $1 RETURNING boundary_id`,
        [boundaryId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Boundary not found" });
      }

      res.json({ success: true, message: "Boundary archived successfully" });
    } catch (err: any) {
      console.error("[DELETE /api/boundaries/:id] Error:", err);
      res.status(500).json({ error: "Failed to delete boundary", details: err.message });
    }
  });
}
