// Comprehensive Exemption Rules Engine for SGWA NOC Portal
// Based on 10-02-2025 Notification and Annexures

const { TRANSITION_CONFIG } = require('./transition-rules.config');

/**
 * Exemption Categories
 */
const EXEMPTION_CATEGORIES = {
    AGRICULTURE: {
        code: 'AGR',
        name: 'Agricultural Activities',
        description: 'Groundwater extraction for agricultural purposes',
        maxLimit: null, // No limit specified
        requiresNOC: false
    },
    DOMESTIC_INDIVIDUAL: {
        code: 'DOM_IND',
        name: 'Individual Domestic Use',
        description: 'Individual consumers for domestic purposes',
        maxLimit: null,
        requiresNOC: false
    },
    DOMESTIC_LIMITED: {
        code: 'DOM_LIM',
        name: 'Domestic/Drinking (≤5 m³/day)',
        description: 'Any project using GW only for drinking/domestic purposes ≤5 cum/day',
        maxLimit: 5, // m³/day
        requiresNOC: false
    },
    MSME_SMALL: {
        code: 'MSME_SM',
        name: 'MSME (<10 m³/day)',
        description: 'Micro and Small Enterprises drawing less than 10 cum/day',
        maxLimit: 10, // m³/day
        requiresNOC: false
    }
};

/**
 * Check if applicant qualifies for exemption
 */
const checkExemption = (formData) => {
    const result = {
        isExempt: false,
        exemptionType: null,
        exemptionCode: null,
        reason: '',
        message: ''
    };

    const dailyRequirement = parseFloat(formData.waterRequirement) || 0;
    const projectType = formData.SectorType; // Industry, Mining, etc.
    const industryType = formData.industryType || '';

    // --- 0. STRICT BANS (Rule Zero) ---
    const utilizationType = formData.SectorType; // Use "SectorType" or "groundWaterUtilizationFor" depend on input
    const isBannedType = TRANSITION_CONFIG.EXEMPTIONS.NON_EXEMPT_TYPES.some(type =>
        utilizationType === type ||
        (type === 'Commercial' && ['Hotel/Resort', 'Provisional NOC (New Project)'].includes(formData.applicationType))
    );

    if (isBannedType) {
        // Special Check: Industry is banned, UNLESS it's MSME Small/Micro (handled below)
        // But even MSME is NOT exempt if it's Packaged Water.
        if (industryType.includes('Packaged') || industryType.includes('Mineral Water')) {
            result.message = '❌ Packaged Driving Water Units are NEVER Exempt, even if MSME.';
            return result;
        }
    }

    // 1. Check Agriculture (Statutory Exemption)
    if (formData.SectorType === 'Agriculture') {
        result.isExempt = true;
        result.exemptionType = 'Agricultural Activities';
        result.exemptionCode = 'AGR';
        result.message = '✅ Agricultural activity is EXEMPT from NOC.';
        return result;
    }

    // 2. Check MSME Exemption (Strict 10 KLD Limit)
    const isMicroOrSmall = formData.msmeClass === 'Micro' || formData.msmeClass === 'Small';

    if (formData.isMSME && isMicroOrSmall) {
        // Must be under 10 KLD
        if (dailyRequirement < TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD) {
            result.isExempt = true;
            result.exemptionType = `MSME Small/Micro (<${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD)`;
            result.exemptionCode = 'MSME_SM';
            result.message = `✅ MSME drawing <${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD is EXEMPT.`;
            return result;
        } else {
            result.message = `⚠️ MSME Exemption applies only for <${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD. Your requirement is ${dailyRequirement} KLD.`;
            return result;
        }
    }

    // Not exempt
    result.message = '⚠️ This project requires mandatory NOC under 2025 Act.';
    return result;
};

module.exports = {
    EXEMPTION_CATEGORIES,
    checkExemption
};
