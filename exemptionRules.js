// Comprehensive Exemption Rules Engine for SGWA NOC Portal
// Based on 10-02-2025 Notification and Annexures

/**
 * Exemption Categories as per SGWA Regulations
 */
export const EXEMPTION_CATEGORIES = {
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
    RESIDENTIAL_EWS: {
        code: 'RES_EWS',
        name: 'EWS Residential Apartments',
        description: 'Residential apartments/group housing (EWS) for drinking/domestic',
        maxLimit: null,
        requiresNOC: false
    },
    GOVT_DRINKING_WATER: {
        code: 'GOVT_DW',
        name: 'Government Drinking Water Schemes',
        description: 'Government drinking water supply schemes',
        maxLimit: null,
        requiresNOC: false
    },
    ARMED_FORCES: {
        code: 'ARMED_F',
        name: 'Armed Forces',
        description: 'Armed Forces and Central Armed Police Forces',
        maxLimit: null,
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
 * @param {Object} formData - Application form data
 * @returns {Object} - Exemption status and details
 */
import { TRANSITION_CONFIG } from '../../../config/transitionRules';

// ... (Existing EXEMPTION_CATEGORIES object remains same, it is just for display) ...

/**
 * Check if applicant qualifies for exemption
 * @param {Object} formData - Application form data
 * @returns {Object} - Exemption status and details
 */
export const checkExemption = (formData) => {
    const result = {
        isExempt: false,
        exemptionType: null,
        exemptionCode: null,
        reason: '',
        message: ''
    };

    const dailyRequirement = parseFloat(formData.dailyWaterRequirement) || 0;
    const projectType = formData.groundWaterUtilizationFor; // Industry, Mining, etc.
    const industryType = formData.industryType || '';

    // --- 0. STRICT BANS (Rule Zero) ---
    // Certain categories are NEVER Exempt, regardless of quantity.

    // Check Configured Non-Exempt Types (Industry, Mining, Commercial etc.)
    const utilizationType = formData.groundWaterUtilizationFor;
    const isBannedType = TRANSITION_CONFIG.EXEMPTIONS.NON_EXEMPT_TYPES.some(type =>
        utilizationType === type ||
        (type === 'Commercial' && ['Hotel/Resort', 'Provisional NOC (New Project)'].includes(formData.applicationType)) // Heuristic
    );

    if (isBannedType) {
        // Special Check: Industry is banned, UNLESS it's MSME Small/Micro (handled below)
        // But even MSME is NOT exempt if it's Packaged Water.

        if (industryType.includes('Packaged') || industryType.includes('Mineral Water')) {
            result.message = '❌ Packaged Driving Water Units are NEVER Exempt, even if MSME.';
            return result;
        }

        // If it is Industry/Mining, we check strictly.
        if (utilizationType === 'Mining') {
            result.message = '❌ Mining projects are NEVER Exempt.';
            return result;
        }
    }


    // 1. Check Agriculture (Statutory Exemption)
    if (formData.groundWaterUtilizationFor === 'Agriculture') {
        result.isExempt = true;
        result.exemptionType = 'Agricultural Activities';
        result.exemptionCode = 'AGR';
        result.message = '✅ Agricultural activity is EXEMPT from NOC.';
        return result;
    }

    // 2. Check Individual Domestic Use
    if (formData.applicationType === 'Individual Domestic Use' ||
        (formData.groundWaterUtilizationFor === 'Drinking/Domestic' && dailyRequirement <= TRANSITION_CONFIG.EXEMPTIONS.DOMESTIC_MAX_KLD)) {
        result.isExempt = true;
        result.exemptionType = `Domestic Use (≤${TRANSITION_CONFIG.EXEMPTIONS.DOMESTIC_MAX_KLD} KLD)`;
        result.exemptionCode = 'DOM_LIM';
        result.message = `✅ Domestic use ≤${TRANSITION_CONFIG.EXEMPTIONS.DOMESTIC_MAX_KLD} KLD is EXEMPT.`;
        return result;
    }

    // 3. Armed Forces
    if (formData.organizationType === 'Armed Forces' || formData.organizationType === 'Central Armed Police Forces') {
        result.isExempt = true;
        result.exemptionType = 'Armed Forces';
        result.exemptionCode = 'ARMED_F';
        result.message = '✅ Armed Forces are EXEMPT.';
        return result;
    }

    // 4. Check MSME Exemption (Strict 10 KLD Limit)
    const isMicroOrSmall = formData.msmeType === 'Micro' || formData.msmeType === 'Small';

    if (formData.isMSME === 'Yes' && isMicroOrSmall) {
        // Must be under 10 KLD
        if (dailyRequirement < TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD) {
            result.isExempt = true;
            result.exemptionType = `MSME Small/Micro (<${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD)`;
            result.exemptionCode = 'MSME_SM';
            result.message = `✅ MSME drawing <${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD is EXEMPT.`;
            return result;
        } else {
            // Explicit message why not exempt
            result.message = `⚠️ MSME Exemption applies only for <${TRANSITION_CONFIG.EXEMPTIONS.MSME_MAX_KLD} KLD. Your requirement is ${dailyRequirement} KLD.`;
            return result;
        }
    }

    // Not exempt
    result.message = '⚠️ This project requires mandatory NOC under 2025 Act.';
    return result;
};

/**
 * Get exemption eligibility explanation
 * @returns {Array} - List of exemption categories with descriptions
 */
export const getExemptionCategories = () => {
    return Object.values(EXEMPTION_CATEGORIES).map(cat => ({
        name: cat.name,
        description: cat.description,
        limit: cat.maxLimit ? `≤${cat.maxLimit} m³/day` : 'No limit',
        code: cat.code
    }));
};

/**
 * Validate if exemption claim is valid
 * @param {Object} formData - Form data
 * @param {string} claimedExemptionCode - Claimed exemption code
 * @returns {boolean} - Whether claim is valid
 */
export const validateExemptionClaim = (formData, claimedExemptionCode) => {
    const exemptionCheck = checkExemption(formData);
    return exemptionCheck.isExempt && exemptionCheck.exemptionCode === claimedExemptionCode;
};

/**
 * Get user-friendly exemption message for display
 * @param {Object} exemptionResult - Result from checkExemption
 * @returns {Object} - Display configuration
 */
export const getExemptionDisplayConfig = (exemptionResult) => {
    if (!exemptionResult.isExempt) {
        return {
            show: false,
            type: 'info',
            icon: 'ℹ️',
            title: 'NOC Required',
            message: exemptionResult.message
        };
    }

    return {
        show: true,
        type: 'success',
        icon: '🎉',
        title: 'NOC Exemption Applicable',
        message: exemptionResult.message,
        details: [
            `Exemption Category: ${exemptionResult.exemptionType}`,
            `Reason: ${exemptionResult.reason}`,
            'You do not need to proceed with the full NOC application.',
            'However, you may need to maintain records for compliance purposes.'
        ]
    };
};
