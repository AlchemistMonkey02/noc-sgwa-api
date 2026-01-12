// Block Classification System for SGWA
// Based on Annexure-7: Block-wise GW Category

/**
 * Block Categories as per SGWA Classification
 */
export const BLOCK_CATEGORIES = {
    SAFE: {
        code: 'SAFE',
        name: 'Safe',
        description: 'Groundwater development is below 70% of potential',
        color: '#28a745', // Green
        validityYears: 5,
        restrictions: []
    },
    SEMI_CRITICAL: {
        code: 'SEMI_CRITICAL',
        name: 'Semi-Critical',
        description: 'Groundwater development is between 70-90% of potential',
        color: '#ffc107', // Yellow
        validityYears: 5,
        restrictions: ['Enhanced monitoring required']
    },
    CRITICAL: {
        code: 'CRITICAL',
        name: 'Critical',
        description: 'Groundwater development is between 90-100% of potential',
        color: '#ff9800', // Orange
        validityYears: 5,
        restrictions: ['Mandatory piezometer', 'Enhanced monitoring', 'Rainwater harvesting mandatory']
    },
    OVER_EXPLOITED: {
        code: 'OVER_EXPLOITED',
        name: 'Over-Exploited',
        description: 'Groundwater development exceeds 100% of potential',
        color: '#dc3545', // Red
        validityYears: 2,
        restrictions: [
            'No new packaged drinking water industry',
            'Reduced validity (2 years)',
            'Mandatory piezometer',
            'Strict monitoring',
            'Rainwater harvesting mandatory'
        ]
    },
    SALINITY: {
        code: 'SALINITY',
        name: 'Salinity Affected',
        description: 'Area affected by salinity issues',
        color: '#6c757d', // Gray
        validityYears: 5,
        restrictions: ['Water quality monitoring mandatory', 'Treatment required']
    }
};

/**
 * Sample Block Classification Data
 * In production, this should come from database
 * Format: District → Block → Category
 */
export const BLOCK_CLASSIFICATION_DATA = {
    'Kamrup Metropolitan': {
        'Guwahati': 'OVER_EXPLOITED',
        'Dispur': 'CRITICAL',
        'Rani': 'SEMI_CRITICAL'
    },
    'Kamrup': {
        'Boko': 'SAFE',
        'Chaygaon': 'SAFE',
        'Hajo': 'SEMI_CRITICAL',
        'Kamalpur': 'SAFE',
        'Palashbari': 'SAFE',
        'Rangia': 'SEMI_CRITICAL'
    },
    'Nagaon': {
        'Hojai': 'SEMI_CRITICAL',
        'Lumding': 'SAFE',
        'Nagaon': 'CRITICAL',
        'Raha': 'SEMI_CRITICAL'
    },
    'Dhubri': {
        'Bilasipara': 'SAFE',
        'Dhubri': 'SAFE',
        'Golakganj': 'SAFE'
    },
    'Dibrugarh': {
        'Chabua': 'SAFE',
        'Dibrugarh': 'CRITICAL',
        'Naharkatia': 'SEMI_CRITICAL',
        'Tingkhong': 'SAFE'
    },
    'Jorhat': {
        'Jorhat': 'CRITICAL',
        'Majuli': 'SAFE',
        'Titabar': 'SEMI_CRITICAL'
    },
    'Sonitpur': {
        'Tezpur': 'CRITICAL',
        'Gohpur': 'SAFE',
        'Biswanath': 'SEMI_CRITICAL'
    },
    'Cachar': {
        'Silchar': 'OVER_EXPLOITED',
        'Lakhipur': 'CRITICAL',
        'Sonai': 'SEMI_CRITICAL'
    }
    // Add more districts and blocks as needed
};

/**
 * Get all districts
 * @param {string} state - State name (optional, for future state filtering)
 * @returns {Array<string>} - List of districts
 */
export const getDistricts = (state = null) => {
    // For now, return all districts. In future, filter by state if needed
    return Object.keys(BLOCK_CLASSIFICATION_DATA).sort();
};

/**
 * Get blocks for a specific district
 * @param {string} state - State name (optional, currently unused)
 * @param {string} district - District name
 * @returns {Array<string>} - List of blocks
 */
export const getBlocksForDistrict = (state, district) => {
    if (!district || !BLOCK_CLASSIFICATION_DATA[district]) {
        return [];
    }
    return Object.keys(BLOCK_CLASSIFICATION_DATA[district]).sort();
};

/**
 * Get block category
 * @param {string} district - District name
 * @param {string} block - Block name
 * @returns {Object|null} - Block category details or null
 */
export const getBlockCategory = (district, block) => {
    if (!BLOCK_CLASSIFICATION_DATA[district] ||
        !BLOCK_CLASSIFICATION_DATA[district][block]) {
        return null;
    }

    const categoryCode = BLOCK_CLASSIFICATION_DATA[district][block];
    return BLOCK_CATEGORIES[categoryCode];
};

/**
 * Check if project is allowed in the block
 * @param {string} district - District name
 * @param {string} block - Block name
 * @param {Object} projectDetails - Project details
 * @returns {Object} - Eligibility result
 */
export const checkBlockEligibility = (district, block, projectDetails) => {
    const category = getBlockCategory(district, block);

    if (!category) {
        return {
            allowed: false,
            reason: 'Block not found in classification database'
        };
    }

    // Check packaged water restriction in over-exploited areas
    if (category.code === 'OVER_EXPLOITED') {
        if (projectDetails.industryType === 'Packaged Drinking Water' ||
            projectDetails.industryType === 'Mineral Water') {
            return {
                allowed: false,
                reason: 'New packaged drinking water/mineral water industry not permitted in over-exploited blocks as per SGWA Regulations',
                category: category.name
            };
        }
    }

    return {
        allowed: true,
        category: category.name,
        categoryCode: category.code,
        validityYears: category.validityYears,
        restrictions: category.restrictions
    };
};

/**
 * Get NOC validity period based on block category
 * @param {string} district - District name
 * @param {string} block - Block name
 * @returns {number} - Validity in years
 */
export const getNOCValidity = (district, block) => {
    const category = getBlockCategory(district, block);
    return category ? category.validityYears : 5; // Default 5 years if not found
};

/**
 * Get block category display configuration
 * @param {Object} category - Block category object
 * @returns {Object} - Display configuration
 */
export const getBlockCategoryDisplay = (category) => {
    if (!category) {
        return {
            badge: 'Unknown',
            color: '#6c757d',
            description: 'Block category not available'
        };
    }

    return {
        badge: category.name,
        color: category.color,
        description: category.description,
        restrictions: category.restrictions,
        validity: `${category.validityYears} years`
    };
};

/**
 * Determine geology type (for piezometer requirements)
 * This is a simplified mapping - in production, should come from GIS/database
 * @param {string} district - District name
 * @returns {string} - 'Hard Rock' or 'Alluvium'
 */
export const getGeologyType = (district) => {
    // Simplified classification
    // In reality, this varies within districts
    const alluviumDistricts = ['Dhubri', 'Bongaigaon', 'Barpeta', 'Nalbari', 'Kamrup', 'Kamrup Metropolitan', 'Cachar', 'Karimganj', 'Hailakandi'];

    return alluviumDistricts.includes(district) ? 'Alluvium' : 'Hard Rock';
};

/**
 * Calculate piezometer requirement
 * @param {number} dailyExtraction - Daily extraction in m³/day
 * @param {string} geologyType - 'Hard Rock' or 'Alluvium'
 * @returns {Object} - Piezometer requirement details
 */
export const calculatePiezometerRequirement = (dailyExtraction, geologyType) => {
    let required = false;
    let reason = '';

    if (geologyType === 'Hard Rock' && dailyExtraction > 100) {
        required = true;
        reason = `Piezometer mandatory for extraction >100 m³/day in Hard Rock areas`;
    } else if (geologyType === 'Alluvium' && dailyExtraction > 500) {
        required = true;
        reason = `Piezometer mandatory for extraction >500 m³/day in Alluvium areas`;
    } else {
        reason = `Piezometer not mandatory (${dailyExtraction} m³/day in ${geologyType})`;
    }

    return {
        required,
        reason,
        specifications: required ? {
            minimumDistance: '≥50 meters from pumping well',
            depth: 'Equal to pumping well depth',
            monitoring: 'Monthly water level data required',
            waterQuality: 'Annual water quality testing (NABL lab)'
        } : null
    };
};
