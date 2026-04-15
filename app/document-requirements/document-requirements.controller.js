/**
 * Document Requirements Controller
 * Handles HTTP requests for document requirements
 */

const documentRequirementsService = require("./document-requirements.service");

class DocumentRequirementsController {
    /**
     * Get required documents based on application type and parameters
     * POST /api/tools/document-requirements
     * 
     * Supports two input formats:
     * 1. New format: applicationType (INDUSTRY/MINING/INFRASTRUCTURE) + utilizationFor (NEW/EXISTING) + purpose (for Infrastructure)
     * 2. Old format: applicationType (FRESH_INDUSTRY, RENEWAL_MINING, etc.)  */
    getDocumentRequirements(req, res, next) {
        try {
            let {
                applicationType,
                utilizationFor,
                purpose,
                withdrawalKLD,
                areaType,
                rockType,
                projectInWetlandZone,
                dewateringInvolved,
                appTypeCode,
                appSubTypeCode
            } = req.body;

            // Map appTypeCode to applicationType if provided
            // Logic: 2->INDUSTRY, 3->INFRASTRUCTURE, 4->MINING
            if (!applicationType && appTypeCode) {
                const code = Number(appTypeCode);
                switch (code) {
                    case 2:
                        applicationType = "INDUSTRY";
                        break;
                    case 4:
                        applicationType = "MINING";
                        break;
                    case 3:
                        applicationType = "INFRASTRUCTURE";
                        break;
                    case 1:
                        applicationType = "INFRASTRUCTURE"; // Bulk Water Supply treated as Infrastructure
                        break;
                }
            }

            // Also handle case where numeric ID or specific string is passed in applicationType field directly
            if (applicationType) {
                if (!isNaN(applicationType)) {
                    const code = Number(applicationType);
                    switch (code) {
                        case 2:
                            applicationType = "INDUSTRY";
                            break;
                        case 4:
                            applicationType = "MINING";
                            break;
                        case 3:
                            applicationType = "INFRASTRUCTURE";
                            break;
                        case 1:
                            applicationType = "INFRASTRUCTURE";
                            break;
                    }
                } else if (applicationType && typeof applicationType === 'string' && applicationType.trim().toUpperCase() === "BULK WATER SUPPLY") {
                    applicationType = "INFRASTRUCTURE";
                }
            }

            // Auto-map purpose for Infrastructure if not provided
            if (applicationType === "INFRASTRUCTURE" && !purpose) {
                // Verify if subtypes map to CONSTRUCTION or DRINKING_DOMESTIC
                // For now, most subtypes (Residential, Commercial, etc.) imply DRINKING_DOMESTIC
                // Construction is usually a phase, but if specific subtypes implied it, we'd map here.
                // Defaulting to DRINKING_DOMESTIC for now as it covers the operational phase.
                purpose = "DRINKING_DOMESTIC";
            }

            // Validate required fields
            if (!applicationType) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "applicationType is required"
                    }
                });
            }

            // withdrawalKLD is now optional to allow listing all documents
            /* 
            if (withdrawalKLD === undefined || withdrawalKLD === null) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "withdrawalKLD is required"
                    }
                });
            }
            */

            // Validate new format inputs
            if (utilizationFor && !["NEW", "EXISTING"].includes(utilizationFor)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "utilizationFor must be NEW or EXISTING"
                    }
                });
            }

            if (utilizationFor && !["INDUSTRY", "MINING", "INFRASTRUCTURE", "BULK WATER SUPPLY"].includes(applicationType)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "When using utilizationFor, applicationType must be INDUSTRY, MINING, INFRASTRUCTURE or BULK WATER SUPPLY"
                    }
                });
            }

            // Build params object
            const params = {
                applicationType,
                utilizationFor,
                purpose,
                withdrawalKLD: (withdrawalKLD !== undefined && withdrawalKLD !== null) ? parseFloat(withdrawalKLD) : undefined,
                areaType,
                rockType,
                projectInWetlandZone: projectInWetlandZone === true || projectInWetlandZone === "true",
                dewateringInvolved: dewateringInvolved === true || dewateringInvolved === "true"
            };

            // Get required documents
            const documents = documentRequirementsService.getRequiredDocuments(params);
            const category = documentRequirementsService.getWithdrawalCategory(params.withdrawalKLD);

            // Return response
            res.status(200).json({
                success: true,
                data: {
                    applicationType,
                    utilizationFor,
                    purpose,
                    withdrawalKLD: params.withdrawalKLD,
                    withdrawalCategory: category,
                    totalDocuments: documents.length,
                    requiredDocuments: documents
                },
                message: "Document requirements retrieved successfully"
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DocumentRequirementsController();
