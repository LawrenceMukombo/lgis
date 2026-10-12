import { pool } from '../server/db';

async function main() {
  console.log("🇿🇲 Seeding realistic, editable Zambian records for Lusaka City Council...");

  try {
    // 1. Get Lusaka City Council ID
    const lccRes = await pool.query("SELECT council_id FROM councils WHERE name ILIKE '%Lusaka%' AND country_code = 'ZM' LIMIT 1;");
    if (lccRes.rows.length === 0) {
      throw new Error("Lusaka City Council not found in database!");
    }
    const lccId = lccRes.rows[0].council_id;
    console.log("📍 Target Lusaka City Council ID:", lccId);

    // 2. Seed Council Units (Departments)
    const units = [
      { name: "Licensing & Permits Department", type: "department" },
      { name: "Revenue & Finance Department", type: "department" },
      { name: "Public Health & Inspections", type: "department" },
      { name: "City Planning & Zoning", type: "department" },
      { name: "Engineering & Infrastructure", type: "department" },
      { name: "Waste Management Unit", type: "unit" },
    ];

    for (const u of units) {
      await pool.query(`
        INSERT INTO council_units (council_id, name, type)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
      `, [lccId, u.name, u.type]);
    }
    console.log("✅ Seeded Lusaka Council Units");

    // 3. Seed Citizens
    const citizensData = [
      {
        nationalId: "182930/11/1",
        localCitizenNo: "LCC-CIT-00101",
        firstName: "Mwamba",
        lastName: "Chileshe",
        dob: "1988-04-12",
        sex: "male",
        phone: "+260 97 1234567",
        email: "mwamba.chileshe@gmail.com",
        address: "Plot 452, Independence Avenue, Woodlands",
        section: "Woodlands",
        lot: "452",
        block: "A",
        suburb: "Woodlands",
        district: "Lusaka",
        province: "Lusaka",
        nationality: "Zambia"
      },
      {
        nationalId: "293847/11/1",
        localCitizenNo: "LCC-CIT-00102",
        firstName: "Mutale",
        lastName: "Bwalya",
        dob: "1992-09-24",
        sex: "female",
        phone: "+260 96 2345678",
        email: "mutale.bwalya@yahoo.com",
        address: "House 28, Kafue Road, Chilenje South",
        section: "Chilenje South",
        lot: "28",
        block: "C",
        suburb: "Chilenje",
        district: "Lusaka",
        province: "Lusaka",
        nationality: "Zambia"
      },
      {
        nationalId: "384920/11/1",
        localCitizenNo: "LCC-CIT-00103",
        firstName: "Kondwani",
        lastName: "Phiri",
        dob: "1985-11-03",
        sex: "male",
        phone: "+260 95 3456789",
        email: "kondwani.phiri@outlook.com",
        address: "Stand 114, Great East Road, Rhodes Park",
        section: "Rhodes Park",
        lot: "114",
        block: "B",
        suburb: "Rhodes Park",
        district: "Lusaka",
        province: "Lusaka",
        nationality: "Zambia"
      },
      {
        nationalId: "492019/11/1",
        localCitizenNo: "LCC-CIT-00104",
        firstName: "Thandiwe",
        lastName: "Banda",
        dob: "1995-02-17",
        sex: "female",
        phone: "+260 97 4567890",
        email: "thandiwe.banda@gmail.com",
        address: "Plot 89, Church Road, Fairview",
        section: "Fairview",
        lot: "89",
        block: "A",
        suburb: "Fairview",
        district: "Lusaka",
        province: "Lusaka",
        nationality: "Zambia"
      },
      {
        nationalId: "501928/11/1",
        localCitizenNo: "LCC-CIT-00105",
        firstName: "Dalitso",
        lastName: "Zulu",
        dob: "1980-07-30",
        sex: "male",
        phone: "+260 96 5678901",
        email: "dalitso.zulu@gmail.com",
        address: "Plot 1204, Commonwealth Avenue, Matero",
        section: "Matero",
        lot: "1204",
        block: "D",
        suburb: "Matero",
        district: "Lusaka",
        province: "Lusaka",
        nationality: "Zambia"
      }
    ];

    const citizenIds: string[] = [];
    for (const c of citizensData) {
      const res = await pool.query(`
        INSERT INTO citizens (
          council_id, national_id, local_citizen_no, first_name, last_name,
          dob, sex, phone, email, address, section, lot, block, suburb,
          district, province, nationality
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT DO NOTHING
        RETURNING citizen_id;
      `, [
        lccId, c.nationalId, c.localCitizenNo, c.firstName, c.lastName,
        c.dob, c.sex, c.phone, c.email, c.address, c.section, c.lot, c.block, c.suburb,
        c.district, c.province, c.nationality
      ]);
      if (res.rows.length > 0) {
        citizenIds.push(res.rows[0].citizen_id);
      }
    }
    console.log(`✅ Seeded ${citizenIds.length} Zambian Citizens`);

    // 4. Seed Businesses
    const businessesData = [
      {
        registrationNo: "PACRA-2018-09142",
        tin: "TPIN-1002345678",
        legalName: "Trade Kings Limited",
        tradingName: "Trade Kings Zambia",
        businessType: "Company",
        industry: "Manufacturing & Retail",
        ownerName: "Khalid Patel",
        contactPhone: "+260 211 286 117",
        contactEmail: "info@tradekings.co.zm",
        physicalAddress: "Plot 29381, Nampundwe Road, Heavy Industrial Area",
        latitude: -15.4285,
        longitude: 28.2520,
        section: "Industrial Area",
        lot: "29381",
        block: "A",
        suburb: "Heavy Industrial",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2019-11482",
        tin: "TPIN-1001928374",
        legalName: "Zambeef Products PLC",
        tradingName: "Zambeef Lusaka Retail",
        businessType: "Company",
        industry: "Agribusiness & Food Processing",
        ownerName: "Francis Grogan",
        contactPhone: "+260 211 369 000",
        contactEmail: "contact@zambeef.co.zm",
        physicalAddress: "Plot 4970, Great East Road, Arcadia",
        latitude: -15.4150,
        longitude: 28.2910,
        section: "Arcadia",
        lot: "4970",
        block: "B",
        suburb: "Arcadia",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2020-04519",
        tin: "TPIN-1003847561",
        legalName: "Choppies Supermarkets Zambia Ltd",
        tradingName: "Choppies Supermarket Cairo Road",
        businessType: "Company",
        industry: "Retail & Groceries",
        ownerName: "Ramachandran Ottapathu",
        contactPhone: "+260 211 228 991",
        contactEmail: "lusakacbd@choppies.co.zm",
        physicalAddress: "Stand 412, Cairo Road, Central Business District",
        latitude: -15.4192,
        longitude: 28.2815,
        section: "Cairo Road CBD",
        lot: "412",
        block: "C",
        suburb: "City Centre",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2021-08129",
        tin: "TPIN-1004928173",
        legalName: "Lusaka Apex Medical Clinic",
        tradingName: "Apex Medical Centre Woodlands",
        businessType: "Company",
        industry: "Healthcare & Pharmaceuticals",
        ownerName: "Dr. Evaristo Tembo",
        contactPhone: "+260 211 260 554",
        contactEmail: "admin@apexmedical.co.zm",
        physicalAddress: "Plot 882, Kasama Road, Woodlands Extension",
        latitude: -15.4410,
        longitude: 28.3240,
        section: "Woodlands",
        lot: "882",
        block: "B",
        suburb: "Woodlands Extension",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2022-03102",
        tin: "TPIN-1005829104",
        legalName: "Mukuba Trading & Logistics Ltd",
        tradingName: "Mukuba Express Logistics",
        businessType: "Company",
        industry: "Logistics & Transport",
        ownerName: "Mwamba Chileshe",
        contactPhone: "+260 97 1234567",
        contactEmail: "info@mukubalogistics.zm",
        physicalAddress: "Plot 104, Lumumba Road, Light Industrial Area",
        latitude: -15.4080,
        longitude: 28.2720,
        section: "Light Industrial Area",
        lot: "104",
        block: "A",
        suburb: "Lumumba",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2023-01928",
        tin: "TPIN-1006738291",
        legalName: "Chilenje Fresh Produce Hub",
        tradingName: "Chilenje Fresh Mart",
        businessType: "Sole Trader",
        industry: "Agriculture & Retail",
        ownerName: "Mutale Bwalya",
        contactPhone: "+260 96 2345678",
        contactEmail: "chilenjefresh@gmail.com",
        physicalAddress: "Stand 56, Kafue Road, Chilenje South",
        latitude: -15.4490,
        longitude: 28.3090,
        section: "Chilenje",
        lot: "56",
        block: "B",
        suburb: "Chilenje South",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      },
      {
        registrationNo: "PACRA-2023-09481",
        tin: "TPIN-1007649283",
        legalName: "Woodlands Heights Pharmacy Ltd",
        tradingName: "Heights Pharmacy",
        businessType: "Company",
        industry: "Healthcare & Pharmaceuticals",
        ownerName: "Thandiwe Banda",
        contactPhone: "+260 97 4567890",
        contactEmail: "heightspharmacy@gmail.com",
        physicalAddress: "Shop 14, Woodlands Mall, Lake Road",
        latitude: -15.4350,
        longitude: 28.3310,
        section: "Woodlands Mall",
        lot: "14",
        block: "A",
        suburb: "Woodlands",
        district: "Lusaka",
        province: "Lusaka",
        status: "verified"
      }
    ];

    const businessIds: string[] = [];
    for (const b of businessesData) {
      const res = await pool.query(`
        INSERT INTO businesses (
          council_id, registration_no, tin, legal_name, trading_name,
          business_type, industry, owner_name, contact_phone, contact_email,
          physical_address, latitude, longitude, section, lot, block, suburb,
          district, province, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT DO NOTHING
        RETURNING business_id;
      `, [
        lccId, b.registrationNo, b.tin, b.legalName, b.tradingName,
        b.businessType, b.industry, b.ownerName, b.contactPhone, b.contactEmail,
        b.physicalAddress, b.latitude, b.longitude, b.section, b.lot, b.block, b.suburb,
        b.district, b.province, b.status
      ]);
      if (res.rows.length > 0) {
        businessIds.push(res.rows[0].business_id);
      }
    }
    console.log(`✅ Seeded ${businessIds.length} Zambian Businesses`);

    // 5. Seed Accounts for Billing
    for (let i = 0; i < businessIds.length; i++) {
      await pool.query(`
        INSERT INTO accounts (council_id, holder_type, holder_id, account_no, status)
        VALUES ($1, 'business', $2, $3, 'active')
        ON CONFLICT DO NOTHING;
      `, [lccId, businessIds[i], `LCC-ACC-B${String(i + 1).padStart(4, '0')}`]);
    }
    for (let i = 0; i < citizenIds.length; i++) {
      await pool.query(`
        INSERT INTO accounts (council_id, holder_type, holder_id, account_no, status)
        VALUES ($1, 'citizen', $2, $3, 'active')
        ON CONFLICT DO NOTHING;
      `, [lccId, citizenIds[i], `LCC-ACC-C${String(i + 1).padStart(4, '0')}`]);
    }
    console.log("✅ Seeded Billing Accounts for Lusaka");

    // 6. Seed Council Assets
    const assetsData = [
      {
        assetNo: "LCC-AST-001",
        name: "Lusaka Civic Centre Headquarters",
        type: "building",
        location: "Independence Avenue, Cathedral Hill",
        condition: "excellent",
        value: "45000000.00",
        status: "active"
      },
      {
        assetNo: "LCC-AST-002",
        name: "Soweto Wholesale Market Complex",
        type: "market_facility",
        location: "Lumumba Road, City Centre",
        condition: "good",
        value: "18500000.00",
        status: "active"
      },
      {
        assetNo: "LCC-AST-003",
        name: "Chilenje Municipal Depot & Workshop",
        type: "building",
        location: "Burma Road, Chilenje",
        condition: "good",
        value: "6200000.00",
        status: "active"
      },
      {
        assetNo: "LCC-AST-004",
        name: "Scania Rapid Fire Tender (Fleet #1)",
        type: "vehicle",
        location: "Central Fire Station, Church Road",
        condition: "excellent",
        value: "3800000.00",
        status: "active"
      },
      {
        assetNo: "LCC-AST-005",
        name: "Komatsu Refuse Compactor Truck #04",
        type: "vehicle",
        location: "Chunga Waste Management Depot",
        condition: "fair",
        value: "2100000.00",
        status: "active"
      },
      {
        assetNo: "LCC-AST-006",
        name: "Matero Community Library & Hall",
        type: "building",
        location: "Matero Main Street",
        condition: "good",
        value: "4800000.00",
        status: "active"
      }
    ];

    for (const a of assetsData) {
      await pool.query(`
        INSERT INTO assets (council_id, asset_no, name, type, location, condition, value, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING;
      `, [lccId, a.assetNo, a.name, a.type, a.location, a.condition, a.value, a.status]);
    }
    console.log("✅ Seeded Lusaka Assets & Facilities");

    // 7. Seed Properties
    const propertiesData = [
      {
        parcelId: "LUS-PROP-0091",
        section: "Woodlands",
        lot: "452",
        suburb: "Woodlands",
        district: "Lusaka",
        landType: "state_lease",
        titleNumber: "CT-89214/ZM",
        ownerName: "Trade Kings Properties Ltd",
        ownerType: "business",
        landArea: "2,400 sq m",
        zoning: "Commercial",
        rateableValue: "8500000.00",
        status: "active"
      },
      {
        parcelId: "LUS-PROP-0104",
        section: "City Centre",
        lot: "412",
        suburb: "Cairo Road CBD",
        district: "Lusaka",
        landType: "state_lease",
        titleNumber: "CT-77412/ZM",
        ownerName: "Choppies Properties Zambia",
        ownerType: "business",
        landArea: "1,850 sq m",
        zoning: "Commercial",
        rateableValue: "12400000.00",
        status: "active"
      },
      {
        parcelId: "LUS-PROP-0215",
        section: "Rhodes Park",
        lot: "114",
        suburb: "Rhodes Park",
        district: "Lusaka",
        landType: "state_lease",
        titleNumber: "CT-66321/ZM",
        ownerName: "Kondwani Phiri",
        ownerType: "individual",
        landArea: "1,200 sq m",
        zoning: "Residential",
        rateableValue: "4200000.00",
        status: "active"
      },
      {
        parcelId: "LUS-PROP-0389",
        section: "Heavy Industrial",
        lot: "29381",
        suburb: "Nampundwe Industrial",
        district: "Lusaka",
        landType: "state_lease",
        titleNumber: "CT-90124/ZM",
        ownerName: "Trade Kings Limited",
        ownerType: "business",
        landArea: "15,000 sq m",
        zoning: "Industrial",
        rateableValue: "34000000.00",
        status: "active"
      }
    ];

    for (const p of propertiesData) {
      await pool.query(`
        INSERT INTO properties (
          council_id, parcel_id, section, lot, suburb, district, land_type,
          title_number, owner_name, owner_type, land_area, zoning, rateable_value, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING;
      `, [
        lccId, p.parcelId, p.section, p.lot, p.suburb, p.district, p.landType,
        p.titleNumber, p.ownerName, p.ownerType, p.landArea, p.zoning, p.rateableValue, p.status
      ]);
    }
    console.log("✅ Seeded Lusaka Properties & Rateable Valuations");

    // 8. Seed Services
    const servicesData = [
      { code: "LIC-TRADING-ZM", name: "Commercial Trading Licence", category: "licensing", description: "General trading licence under the Local Government Act of Zambia" },
      { code: "LIC-LIQUOR-ZM", name: "Liquor Licensing & Bar Permit", category: "licensing", description: "Authorization to sell and dispense alcoholic beverages" },
      { code: "LIC-HEALTH-ZM", name: "Public Health & Hygiene Certificate", category: "licensing", description: "Annual public health inspection certificate" },
      { code: "PERM-SIGNAGE-ZM", name: "Outdoor Advertising & Signage Permit", category: "permits", description: "Permit for storefront and billboard advertising" },
      { code: "PERM-BUILDING-ZM", name: "Building & Structural Works Approval", category: "planning", description: "Statutory building permission for construction and alteration" },
      { code: "FEE-WASTE-ZM", name: "Commercial Solid Waste Collection", category: "environment", description: "Municipal refuse removal and landfill management" }
    ];

    const serviceIds: string[] = [];
    for (const s of servicesData) {
      const res = await pool.query(`
        INSERT INTO services (council_id, code, name, category, description, requires_inspection, requires_approval, active)
        VALUES ($1, $2, $3, $4, $5, true, true, true)
        ON CONFLICT DO NOTHING
        RETURNING service_id;
      `, [lccId, s.code, s.name, s.category, s.description]);
      if (res.rows.length > 0) {
        serviceIds.push(res.rows[0].service_id);
      }
    }
    console.log(`✅ Seeded ${serviceIds.length} Council Services`);

    // 9. Seed Service Requests & Licences
    const allServices = await pool.query("SELECT service_id, code FROM services WHERE council_id = $1;", [lccId]);
    const allBusinesses = await pool.query("SELECT business_id, legal_name FROM businesses WHERE council_id = $1;", [lccId]);

    const createdRequests: string[] = [];
    if (allServices.rows.length > 0 && allBusinesses.rows.length > 0) {
      const srvTrading = allServices.rows[0].service_id;
      const srvHealth = allServices.rows[2] ? allServices.rows[2].service_id : allServices.rows[0].service_id;

      for (let i = 0; i < Math.min(allBusinesses.rows.length, 4); i++) {
        const b = allBusinesses.rows[i];
        const reqRef = `SR-2026-LCC-${String(i + 1).padStart(4, '0')}`;
        const reqRes = await pool.query(`
          INSERT INTO service_requests (
            council_id, service_id, requester_type, requester_id, status, channel,
            request_ref, submitted_at, reviewed_at, approved_at
          ) VALUES ($1, $2, 'business', $3, 'approved', 'web', $4, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days')
          ON CONFLICT DO NOTHING
          RETURNING request_id;
        `, [lccId, i % 2 === 0 ? srvTrading : srvHealth, b.business_id, reqRef]);

        if (reqRes.rows.length > 0) {
          const reqId = reqRes.rows[0].request_id;
          createdRequests.push(reqId);

          // Create active Licence
          const licNo = `LCC/TL/2026/${String(i + 1).padStart(5, '0')}`;
          await pool.query(`
            INSERT INTO licences (
              council_id, request_id, licence_no, issue_date, expiry_date, status, version
            ) VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '360 days', 'active', 1)
            ON CONFLICT DO NOTHING;
          `, [lccId, reqId, licNo]);
        }
      }
    }
    console.log(`✅ Seeded ${createdRequests.length} Service Requests and Active Licences`);

    // 10. Seed Inspections
    const inspectorRes = await pool.query("SELECT user_id FROM users WHERE council_id = $1 AND role IN ('officer', 'inspector', 'admin') LIMIT 2;", [lccId]);
    const inspectorId = inspectorRes.rows.length > 0 ? inspectorRes.rows[0].user_id : null;

    const inspectionsData = [
      {
        remarks: "Comprehensive food manufacturing safety compliance. Full marks on hygiene and sanitation.",
        result: "pass",
        lat: -15.4285,
        lng: 28.2520,
        performed: true
      },
      {
        remarks: "Supermarket storage and cold chain inspection. Temperatures within statutory limits.",
        result: "pass",
        lat: -15.4192,
        lng: 28.2815,
        performed: true
      },
      {
        remarks: "Pharmacy storage and controlled medicine dispensary review. Passed with commendation.",
        result: "pass",
        lat: -15.4410,
        lng: 28.3240,
        performed: true
      },
      {
        remarks: "Scheduled quarterly compliance check for logistics yard and fuel safety.",
        result: null,
        lat: -15.4080,
        lng: 28.2720,
        performed: false
      }
    ];

    for (let i = 0; i < inspectionsData.length; i++) {
      const ins = inspectionsData[i];
      const reqId = createdRequests[i] || null;
      const scheduledAt = new Date(Date.now() - 10 * 86400000);
      const performedAt = ins.performed ? new Date(Date.now() - 3 * 86400000) : null;
      await pool.query(`
        INSERT INTO inspections (
          council_id, request_id, inspector_user_id, scheduled_at, performed_at, result, remarks, latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING;
      `, [
        lccId, reqId, inspectorId, scheduledAt, performedAt,
        ins.result, ins.remarks, ins.lat, ins.lng
      ]);
    }
    console.log("✅ Seeded Lusaka Inspections");

    // 11. Seed Invoices & Payments (with Zambian Kwacha - ZMW)
    const lccAccounts = await pool.query("SELECT account_id FROM accounts WHERE council_id = $1 LIMIT 4;", [lccId]);
    const amounts = ["15000.00", "4500.00", "28000.00", "3200.00"];

    for (let i = 0; i < lccAccounts.rows.length; i++) {
      const accId = lccAccounts.rows[i].account_id;
      const invNo = `INV-2026-LCC-${String(i + 1).padStart(4, '0')}`;
      const issuedAt = new Date(Date.now() - 20 * 86400000);
      const dueAt = new Date(Date.now() + 10 * 86400000);
      const paidAt = new Date(Date.now() - 5 * 86400000);

      const invRes = await pool.query(`
        INSERT INTO invoices (
          council_id, account_id, invoice_no, total_amount, currency, status, issued_at, due_at
        ) VALUES ($1, $2, $3, $4, 'ZMW', 'paid', $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING invoice_id;
      `, [lccId, accId, invNo, amounts[i], issuedAt, dueAt]);

      if (invRes.rows.length > 0) {
        const invId = invRes.rows[0].invoice_id;
        const methods = ["mobile_money", "bank_transfer", "bank_transfer", "mobile_money"];
        const providers = ["Airtel Money Zambia", "ZANACO Bank", "Stanbic Bank Zambia", "MTN Mobile Money"];
        const payRef = `PAY-ZM-2026-${String(i + 1).padStart(5, '0')}`;

        await pool.query(`
          INSERT INTO payments (
            council_id, account_id, payment_ref, amount, currency, method, provider, status, paid_at
          ) VALUES ($1, $2, $3, $4, 'ZMW', $5, $6, 'completed', $7)
          ON CONFLICT DO NOTHING;
        `, [lccId, accId, payRef, amounts[i], methods[i], providers[i], paidAt]);
      }
    }
    console.log("✅ Seeded Lusaka Invoices and Payments (in ZMW)");

    // 12. Seed Complaints
    const complaintsData = [
      {
        complainantType: "citizen",
        category: "road_damage",
        status: "investigating",
        description: "Pothole formation on Church Road near Supreme Court round-about.",
        location: "Church Road, Cathedral Hill",
        lat: -15.4200,
        lng: 28.2900
      },
      {
        complainantType: "business",
        category: "littering",
        status: "resolved",
        description: "Illegal dumping behind Soweto Market gate 3 cleared by refuse team.",
        location: "Lumumba Road, City Centre",
        lat: -15.4180,
        lng: 28.2750
      },
      {
        complainantType: "citizen",
        category: "noise",
        status: "new",
        description: "Excessive sound system noise after hours in Chilenje Commercial Zone.",
        location: "Kafue Road, Chilenje South",
        lat: -15.4480,
        lng: 28.3100
      }
    ];

    for (const cmp of complaintsData) {
      await pool.query(`
        INSERT INTO complaints (
          council_id, complainant_type, category, status, description, location, latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING;
      `, [lccId, cmp.complainantType, cmp.category, cmp.status, cmp.description, cmp.location, cmp.lat, cmp.lng]);
    }
    console.log("✅ Seeded Lusaka Citizen & Business Complaints");

    console.log("🎉 ALL ZAMBIAN MODULE RECORDS SEEDED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
