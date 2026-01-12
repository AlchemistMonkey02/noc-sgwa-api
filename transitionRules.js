// GOVERNMENT OF RAJASTHAN
// GROUND WATER DEPARTMENT
// TRANSITION MODE CONFIGURATION
// Based on Act dated 10-09-2025 and interim directions.

export const TRANSITION_CONFIG = {
    // A. LEGAL AUTHORITY
    LEGAL_AUTHORITY: {
        ACT_NAME: "Rajasthan Ground Water (Conservation and Management) Authority Act, 2025",
        ACT_DATE: "10-09-2025",
        STATUS: "TRANSITION_MODE", // Rules under formulation
        AUTHORITY_NAME: "Ground Water Department, Government of Rajasthan"
    },

    // B. EXEMPTION RULES (Strict)
    EXEMPTIONS: {
        DOMESTIC_MAX_KLD: 5, // 5 KLD Limit for Domestic
        MSME_MAX_KLD: 10,    // 10 KLD Limit for MSME

        // BANNED from Exemption (Even if < Limit)
        NON_EXEMPT_TYPES: [
            "Industry",
            "Mining",
            "Commercial", // Hotels, Malls, Resorts NEVER exempt
            "Infrastructure",
            "Packaged Drinking Water"
        ]
    },

    // C. RESTRICTIONS
    RESTRICTIONS: {
        // Absolute Ban in Over-Exploited Blocks
        OE_BLOCK_BANS: [
            "Packaged Drinking Water",
            "Mineral Water"
        ],
        PROVISIONAL_VALIDITY_YEARS: 1, // Short validity for provisional
        RENEWAL_WINDOW_DAYS: 90 // Apply 90 days before expiry
    },

    // D. PENALTIES (Fixed Amounts)
    PENALTIES: {
        NO_FLOW_METER: 200000,   // ₹2 Lakh
        NO_PIEZOMETER: 200000,   // ₹2 Lakh
        UNAUTHORIZED_RIG: 100000, // ₹1 Lakh per rig
        FALSE_INFORMATION: 100000, // ₹1 Lakh
        RECHARGE_FAILURE: 500000   // ₹5 Lakh
    },

    // E. CHARGE RATES (Interim/Legacy Slab)
    // Rate per m3 based on Block Category & Use
    CHARGE_RATES: {
        SAFE: {
            INDUSTRY: { SLAB_1: 5.0, SLAB_2: 7.0, SLAB_3: 10.0 }, // <50, 50-100, >100
            MINING: { SLAB_1: 4.0, SLAB_2: 6.0, SLAB_3: 8.0 },
            OTHER: { SLAB_1: 4.0, SLAB_2: 6.0, SLAB_3: 8.0 }
        },
        SEMI_CRITICAL: {
            INDUSTRY: { SLAB_1: 7.0, SLAB_2: 10.0, SLAB_3: 15.0 },
            MINING: { SLAB_1: 6.0, SLAB_2: 8.0, SLAB_3: 12.0 },
            OTHER: { SLAB_1: 6.0, SLAB_2: 8.0, SLAB_3: 12.0 }
        },
        CRITICAL: {
            INDUSTRY: { SLAB_1: 10.0, SLAB_2: 15.0, SLAB_3: 20.0 },
            MINING: { SLAB_1: 8.0, SLAB_2: 12.0, SLAB_3: 18.0 },
            OTHER: { SLAB_1: 8.0, SLAB_2: 12.0, SLAB_3: 18.0 }
        },
        OVER_EXPLOITED: {
            INDUSTRY: { SLAB_1: 15.0, SLAB_2: 20.0, SLAB_3: 30.0 },
            MINING: { SLAB_1: 7.5, SLAB_2: 10.0, SLAB_3: 15.0 }, // 50% of Industry
            OTHER: { SLAB_1: 12.0, SLAB_2: 18.0, SLAB_3: 25.0 }
        }
    }
};
