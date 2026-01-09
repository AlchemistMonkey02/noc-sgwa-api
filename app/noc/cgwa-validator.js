const Joi = require("joi");

/**
 * CGWA-Compliant NOC Application Validators
 */

// Hydrogeology validation schema
const hydrogeologySchema = Joi.object({
    aquiferType: Joi.string().valid("CONFINED", "UNCONFINED", "SEMI_CONFINED").optional(),
    aquiferDepthRange: Joi.object({
        from: Joi.number().min(0).required(),
        to: Joi.number().min(Joi.ref("from")).required(),
    }).optional(),
    staticWaterLevel: Joi.number().min(0).optional(),
    dynamicWaterLevel: Joi.number().min(Joi.ref("staticWaterLevel")).optional(),
    drawdown: Joi.number().min(0).optional(),
    recoveryRate: Joi.number().min(0).optional(),
    waterQuality: Joi.string().valid("POTABLE", "NON_POTABLE", "SALINE").optional(),
    pumpingTest: Joi.object({
        conducted: Joi.boolean().default(false),
        duration: Joi.when("conducted", {
            is: true,
            then: Joi.number().required(),
            otherwise: Joi.optional(),
        }),
        dischargeRate: Joi.when("conducted", {
            is: true,
            then: Joi.number().required(),
            otherwise: Joi.optional(),
        }),
        conductedBy: Joi.when("conducted", {
            is: true,
            then: Joi.string().required(),
            otherwise: Joi.optional(),
        }),
        reportDate: Joi.date().max("now").optional(),
        documentId: Joi.string().optional(),
    }).optional(),
}).optional();

// Conservation measures validation
const conservationMeasuresSchema = Joi.object({
    rainwaterHarvesting: Joi.object({
        implemented: Joi.boolean().required(),
        structures: Joi.when("implemented", {
            is: true,
            then: Joi.array().items(
                Joi.object({
                    type: Joi.string()
                        .valid("ROOFTOP", "SURFACE", "RECHARGE_PIT", "RECHARGE_WELL", "PERCOLATION_TANK")
                        .required(),
                    capacity: Joi.number().min(0).required(),
                    rechargeArea: Joi.number().min(0).optional(),
                    location: Joi.string().optional(),
                })
            ).min(1).required(),
            otherwise: Joi.optional(),
        }),
        totalRechargeCapacity: Joi.number().min(0).optional(),
    }).required(),
    recyclingReuse: Joi.object({
        planned: Joi.boolean().default(false),
        percentage: Joi.when("planned", {
            is: true,
            then: Joi.number().min(0).max(100).required(),
            otherwise: Joi.optional(),
        }),
        treatmentMethod: Joi.string().optional(),
        reuseApplication: Joi.string().optional(),
    }).optional(),
    waterAudit: Joi.object({
        mechanism: Joi.string().optional(),
        frequency: Joi.string().valid("MONTHLY", "QUARTERLY", "ANNUALLY").optional(),
        lastAuditDate: Joi.date().max("now").optional(),
    }).optional(),
    conservationPlanDocument: Joi.object({
        uploaded: Joi.boolean().optional(),
        documentId: Joi.string().optional(),
        uploadedAt: Joi.date().optional(),
    }).optional(),
}).required();

// Undertakings validation - all must be true
const undertakingsSchema = Joi.object({
    informationAccuracy: Joi.boolean().valid(true).required()
        .messages({ "any.only": "You must confirm the accuracy of information" }),
    complianceAgreement: Joi.boolean().valid(true).required()
        .messages({ "any.only": "You must agree to comply with all conditions" }),
    waterMeterInstallation: Joi.boolean().valid(true).required()
        .messages({ "any.only": "You must agree to install water meters" }),
    inspectionConsent: Joi.boolean().valid(true).required()
        .messages({ "any.only": "You must provide consent for inspection" }),
    penaltyAcceptance: Joi.boolean().valid(true).required()
        .messages({ "any.only": "You must accept penalty clauses" }),
    undertakingDate: Joi.date().max("now").required(),
    undertakingPlace: Joi.string().required(),
    digitalSignature: Joi.string().optional(),
}).required();

// Water requirement validation with CGWA compliance
const waterRequirementSchema = Joi.object({
    purpose: Joi.string().required(),
    proposedExtraction: Joi.object({
        numberOfBorewells: Joi.number().min(1).required(),
        borewellDetails: Joi.array().items(
            Joi.object({
                depth: Joi.number().min(1).required(),
                diameter: Joi.number().min(1).required(),
                dischargeCapacity: Joi.number().min(1).required(),
                operatingHours: Joi.number().min(1).max(24).required(),
                operatingDays: Joi.number().min(1).max(31).required(),
            })
        ).optional(),
        totalDailyExtraction: Joi.number().min(0).required(),
        totalAnnualExtraction: Joi.number().min(0).optional(),
    }).required(),
    purposeWiseBreakup: Joi.object({
        drinking: Joi.number().min(0).default(0),
        industrial: Joi.number().min(0).default(0),
        cooling: Joi.number().min(0).default(0),
        construction: Joi.number().min(0).default(0),
        irrigation: Joi.number().min(0).default(0),
        other: Joi.number().min(0).default(0),
    }).optional(),
    // Legacy fields
    dailyRequirement: Joi.number().min(0).optional(),
    sourceType: Joi.string().valid("BOREWELL", "TUBE_WELL", "OPEN_WELL").optional(),
    depth: Joi.number().optional(),
    pumpCapacity: Joi.number().optional(),
}).required();

// Main NOC application validation schema (CGWA Compliant)
const nocApplicationSchema = Joi.object({
    // CGWA mandatory fields
    applicationCategory: Joi.string()
        .valid("WITHDRAWAL", "RECHARGE")
        .required()
        .default("WITHDRAWAL"),

    sectorType: Joi.string()
        .valid("INDUSTRIAL", "DOMESTIC", "IRRIGATION", "COMMERCIAL", "INFRASTRUCTURE", "MINING", "OTHER")
        .required(),

    validityPeriodRequested: Joi.number()
        .min(1)
        .max(10)
        .required()
        .default(3),

    applicationType: Joi.string()
        .valid("NEW", "RENEWAL", "AMENDMENT")
        .required(),

    // Location details
    location: Joi.object({
        stateId: Joi.string().required(),
        districtId: Joi.string().required(),
        blockId: Joi.string().required(),
        village: Joi.string().optional(),
        address: Joi.string().optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
    }).required(),

    // Project details
    projectDetails: Joi.object({
        projectName: Joi.string().required(),
        industryType: Joi.string().optional(),
        projectDescription: Joi.string().optional(),
        landArea: Joi.number().min(0).optional(),
        builtUpArea: Joi.number().min(0).optional(),
    }).required(),

    // Water requirements (CGWA compliant)
    waterRequirement: waterRequirementSchema,

    // Hydrogeology (recommended for CGWA)
    hydrogeology: hydrogeologySchema,

    // Conservation measures (MANDATORY for CGWA)
    conservationMeasures: conservationMeasuresSchema,

    // Undertakings (MANDATORY for CGWA)
    undertakings: undertakingsSchema,

    // Existing NOC details (for renewal/amendment)
    existingNOCDetails: Joi.when("applicationType", {
        is: Joi.valid("RENEWAL", "AMENDMENT"),
        then: Joi.object({
            nocNumber: Joi.string().required(),
            issueDate: Joi.date().required(),
            validUpto: Joi.date().required(),
            issuingAuthority: Joi.string().optional(),
            approvedExtraction: Joi.number().optional(),
            actualExtraction: Joi.number().optional(),
            complianceStatus: Joi.string().valid("COMPLIANT", "NON_COMPLIANT", "PARTIAL").optional(),
        }).required(),
        otherwise: Joi.optional(),
    }),

    // Documents
    documents: Joi.array().items(
        Joi.object({
            documentId: Joi.string().required(),
            documentType: Joi.string().required(),
        })
    ).optional(),
});

/**
 * CGWA Compliance Checker
 * Validates application against CGWA norms
 */
const checkCGWACompliance = (application) => {
    const issues = [];
    const totalExtraction = application.waterRequirement?.proposedExtraction?.totalDailyExtraction || 0;
    const isMSME = application.projectDetails?.isMSME || false;
    const landArea = application.projectDetails?.landArea || 0;

    // Check 0: MSME Exemption (< 10 KLD)
    let exemptedNOC = false;
    if (isMSME && totalExtraction < 10) {
        exemptedNOC = true;
        issues.push({
            code: "MSME_EXEMPTION",
            severity: "INFO",
            message: "MSME units with extraction < 10 KLD are eligible for exempted NOC",
            requirement: "CGWA Guidelines - MSME Exemption",
        });
    }

    // Check 1: RWH mandatory for extraction > 10 KLD (unless exempted)
    if (totalExtraction > 10 && !exemptedNOC) {
        const rwhImplemented = application.conservationMeasures?.rainwaterHarvesting?.implemented;
        if (!rwhImplemented) {
            issues.push({
                code: "RWH_MANDATORY",
                severity: "CRITICAL",
                message: "Rainwater harvesting is mandatory for daily extraction exceeding 10 KLD",
                requirement: "CGWA Guidelines 2020",
            });
        }
    }

    // Check 1A: Green belt requirement (for land > 1000 sq m or extraction > 50 KLD)
    if (landArea > 1000 || totalExtraction > 50) {
        const greenBeltImplemented = application.projectDetails?.greenBelt?.implemented;
        const greenBeltArea = application.projectDetails?.greenBelt?.area || 0;
        const greenBeltPercentage = (greenBeltArea / landArea) * 100;

        if (!greenBeltImplemented) {
            issues.push({
                code: "GREEN_BELT_REQUIRED",
                severity: "HIGH",
                message: "Green belt is required for land area > 1000 sq.m or extraction > 50 KLD",
                requirement: "CGWA Guidelines 2020",
            });
        } else if (greenBeltPercentage < 10) {
            issues.push({
                code: "GREEN_BELT_INSUFFICIENT",
                severity: "MEDIUM",
                message: "Green belt should cover at least 10% of total land area",
                requirement: "CGWA Best Practices",
            });
        }
    }

    // Check 2: Hydrogeological data for depth > 100m
    const maxDepth = application.waterRequirement?.proposedExtraction?.borewellDetails?.reduce(
        (max, borewell) => Math.max(max, borewell.depth || 0),
        0
    ) || 0;

    if (maxDepth > 100 && !application.hydrogeology?.aquiferType) {
        issues.push({
            code: "HYDROGEOLOGY_REQUIRED",
            severity: "HIGH",
            message: "Hydrogeological study is required for borewells deeper than 100 meters",
            requirement: "CGWA Guidelines 2020",
        });
    }

    // Check 3: All undertakings must be accepted (unless exempted)
    if (!exemptedNOC) {
        const undertakings = application.undertakings || {};
        const requiredUndertakings = [
            "informationAccuracy",
            "complianceAgreement",
            "waterMeterInstallation",
            "inspectionConsent",
            "penaltyAcceptance",
        ];

        requiredUndertakings.forEach(key => {
            if (!undertakings[key]) {
                issues.push({
                    code: "UNDERTAKING_MISSING",
                    severity: "CRITICAL",
                    message: `Required undertaking not accepted: ${key}`,
                    requirement: "CGWA Application Form",
                });
            }
        });
    }

    // Check 4: Water audit for extraction > 100 KLD
    if (totalExtraction > 100 && !application.conservationMeasures?.waterAudit?.mechanism) {
        issues.push({
            code: "WATER_AUDIT_REQUIRED",
            severity: "MEDIUM",
            message: "Water audit mechanism is required for daily extraction exceeding 100 KLD",
            requirement: "CGWA Guidelines 2020",
        });
    }

    // Check 5: Recycling for industrial use
    if (application.sectorType === "INDUSTRIAL") {
        const recycling = application.conservationMeasures?.recyclingReuse;
        if (!recycling?.planned || (recycling.percentage || 0) < 20) {
            issues.push({
                code: "RECYCLING_REQUIRED",
                severity: "MEDIUM",
                message: "At least 20% recycling is recommended for industrial applications",
                requirement: "CGWA Best Practices",
            });
        }
    }

    // Check 6: MSME certificate validation
    if (isMSME && !application.projectDetails?.msmeDetails?.registrationNumber) {
        issues.push({
            code: "MSME_CERTIFICATE_REQUIRED",
            severity: "HIGH",
            message: "MSME registration certificate is required to claim MSME benefits",
            requirement: "CGWA MSME Exemption Rules",
        });
    }

    return {
        isCompliant: issues.filter(i => i.severity === "CRITICAL").length === 0,
        isExempted: exemptedNOC,
        issues,
        summary: {
            critical: issues.filter(i => i.severity === "CRITICAL").length,
            high: issues.filter(i => i.severity === "HIGH").length,
            medium: issues.filter(i => i.severity === "MEDIUM").length,
            info: issues.filter(i => i.severity === "INFO").length,
        },
    };
};

module.exports = {
    nocApplicationSchema,
    hydrogeologySchema,
    conservationMeasuresSchema,
    undertakingsSchema,
    waterRequirementSchema,
    checkCGWACompliance,
};
