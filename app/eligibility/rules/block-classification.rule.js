// Block Classification System for SGWA
// Based on Annexure-7: Block-wise GW Category

/**
 * Block Categories as per SGWA Classification
 */
const BLOCK_CATEGORIES = {
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
 */
const BLOCK_CLASSIFICATION_DATA = {
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
    },
    "Jaipur": {
        "Sanganer": "OVER_EXPLOITED",
        "Amer": "SEMI_CRITICAL",
        "Jhotwara": "OVER_EXPLOITED"
    }
};

/**
 * Get all districts
 */
const getDistricts = (state = null) => {
    return Object.keys(BLOCK_CLASSIFICATION_DATA).sort();
};

/**
 * Get blocks for a specific district
 */
const getBlocksForDistrict = (state, district) => {
    if (!district || !BLOCK_CLASSIFICATION_DATA[district]) {
        return [];
    }
    return Object.keys(BLOCK_CLASSIFICATION_DATA[district]).sort();
};

/**
 * Get block category
 */
const getBlockCategory = (district, block) => {
    if (!BLOCK_CLASSIFICATION_DATA[district] ||
        !BLOCK_CLASSIFICATION_DATA[district][block]) {
        return null;
    }

    console.log(`[BlockRule] Lookup - District: '${district}', Block: '${block}'`);
    if (!BLOCK_CLASSIFICATION_DATA[district]) {
        console.log(`[BlockRule] District '${district}' NOT FOUND. Available:`, Object.keys(BLOCK_CLASSIFICATION_DATA));
    } else if (!BLOCK_CLASSIFICATION_DATA[district][block]) {
        console.log(`[BlockRule] Block '${block}' NOT FOUND in '${district}'. Available:`, Object.keys(BLOCK_CLASSIFICATION_DATA[district]));
    }

    const categoryCode = BLOCK_CLASSIFICATION_DATA[district][block];
    return BLOCK_CATEGORIES[categoryCode];
};

/**
 * Check if project is allowed in the block
 */
const checkBlockEligibility = (district, block, projectDetails) => {
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
 * Get NOC validity period
 */
const getNOCValidity = (district, block) => {
    const category = getBlockCategory(district, block);
    return category ? category.validityYears : 5;
};

module.exports = {
    BLOCK_CATEGORIES,
    getDistricts,
    getBlocksForDistrict,
    getBlockCategory,
    checkBlockEligibility,
    getNOCValidity
};
