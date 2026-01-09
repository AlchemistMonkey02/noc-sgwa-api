const NOCApplication = require("./noc-application.model");
const Document = require("../documents/document.model");
const logger = require("../utils/logger");

/**
 * AI-Driven Application Validator
 * Intelligent pre-submission check that analyzes entire application
 * and provides suggestions for improvement
 */
class ApplicationValidatorService {
    /**
     * Comprehensive application validation before submission
     * @param {string} applicationId - Application ID
     * @returns {object} Validation results with suggestions
     */
    async validateBeforeSubmission(applicationId) {
        try {
            const application = await NOCApplication.findOne({ applicationId })
                .populate("companyId")
                .populate("userId");

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            // Run all validation checks
            const validationResults = {
                applicationId,
                applicationNumber: application.applicationNumber,
                overallReadiness: 0,
                canSubmit: false,
                criticalIssues: [],
                warnings: [],
                suggestions: [],
                checklist: {
                    sections: await this.validateSections(application),
                    documents: await this.validateDocuments(application),
                    cgwaCompliance: await this.validateCGWACompliance(application),
                    dataConsistency: await this.validateDataConsistency(application),
                    calculations: await this.validateCalculations(application)
                },
                validatedAt: new Date()
            };

            // Calculate overall readiness score
            validationResults.overallReadiness = this.calculateReadinessScore(validationResults.checklist);

            // Determine if can submit
            validationResults.canSubmit = validationResults.criticalIssues.length === 0 &&
                validationResults.overallReadiness >= 90;

            // Generate AI suggestions
            validationResults.aiSuggestions = this.generateAISuggestions(application, validationResults);

            logger.info(`Application validation completed for ${applicationId}`, {
                readiness: validationResults.overallReadiness,
                canSubmit: validationResults.canSubmit
            });

            return validationResults;
        } catch (error) {
            logger.error("Error validating application", error);
            throw error;
        }
    }

    /**
     * Validate all 6 sections completion
     */
    async validateSections(application) {
        const sections = {
            section1: { name: "Basic Details", complete: false, issues: [] },
            section2: { name: "Location Details", complete: false, issues: [] },
            section3: { name: "Drinking & Domestic Use", complete: false, issues: [] },
            section4: { name: "Water Requirement Breakup", complete: false, issues: [] },
            section5: { name: "Ground Water Structures", complete: false, issues: [] },
            section6: { name: "Document Attachments", complete: false, issues: [] }
        };

        // Section 1: Basic Details
        if (application.applicationType && application.sectorType && application.projectDetails?.projectName) {
            sections.section1.complete = true;
        } else {
            sections.section1.issues.push("Missing application type, sector type, or project name");
        }

        // Section 2: Location Details
        if (application.location?.stateId && application.location?.districtId &&
            application.location?.blockId && application.location?.latitude && application.location?.longitude) {
            sections.section2.complete = true;
        } else {
            sections.section2.issues.push("Missing location details (state, district, block, or GPS coordinates)");
        }

        // Section 3: Drinking & Domestic Use
        if (application.drinkingDomesticUse?.numberOfWorkers !== undefined &&
            application.drinkingDomesticUse?.totalDailyDomestic > 0) {
            sections.section3.complete = true;
        } else {
            sections.section3.issues.push("Missing domestic water requirement details");
        }

        // Section 4: Water Requirement Breakup
        if (application.waterRequirementBreakup && application.waterRequirementBreakup.length > 0) {
            sections.section4.complete = true;
        } else {
            sections.section4.issues.push("No water requirement breakup provided");
        }

        // Section 5: Ground Water Structures
        if (application.groundWaterStructures && application.groundWaterStructures.length > 0) {
            sections.section5.complete = true;
        } else {
            sections.section5.issues.push("No groundwater structures (borewells) specified");
        }

        // Section 6: Documents
        if (application.documentsReviewed) {
            sections.section6.complete = true;
        } else {
            sections.section6.issues.push("Documents not reviewed/acknowledged");
        }

        return sections;
    }

    /**
     * Validate document uploads
     */
    async validateDocuments(application) {
        const requiredDocuments = [
            "COMPANY_REGISTRATION",
            "GST_CERTIFICATE",
            "PAN_CARD",
            "LAND_OWNERSHIP",
            "SITE_PLAN",
            "NOC_FROM_AUTHORITIES"
        ];

        const uploadedDocuments = await Document.find({
            applicationId: application._id
        });

        const documentCheck = {
            required: requiredDocuments.length,
            uploaded: uploadedDocuments.length,
            missing: [],
            issues: []
        };

        // Check which documents are missing
        requiredDocuments.forEach(docType => {
            const found = uploadedDocuments.find(doc => doc.documentType === docType);
            if (!found) {
                documentCheck.missing.push(docType);
                documentCheck.issues.push(`Missing ${docType.replace(/_/g, ' ')}`);
            }
        });

        // Check for expired documents
        uploadedDocuments.forEach(doc => {
            if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
                documentCheck.issues.push(`${doc.documentType} has expired`);
            }
        });

        return documentCheck;
    }

    /**
     * Validate CGWA compliance rules
     */
    async validateCGWACompliance(application) {
        const compliance = {
            rules: [],
            violations: [],
            warnings: []
        };

        // Rule 1: RWH mandatory for >10 KLD
        const totalWaterRequirement = this.getTotalWaterRequirement(application);
        if (totalWaterRequirement > 10) {
            if (!application.conservationMeasures?.rainwaterHarvesting) {
                compliance.violations.push({
                    rule: "Rainwater Harvesting Mandatory",
                    message: "RWH is mandatory for water requirement > 10 KLD",
                    severity: "CRITICAL"
                });
            }
        }

        // Rule 2: Water meter mandatory
        if (!application.conservationMeasures?.waterMeterInstallation) {
            compliance.violations.push({
                rule: "Water Meter Installation",
                message: "Digital water meter installation is mandatory",
                severity: "CRITICAL"
            });
        }

        // Rule 3: Hydrogeology study for depth >100m
        const hasDeepBorewells = application.groundWaterStructures?.some(s => s.depth > 100);
        if (hasDeepBorewells && !application.hydrogeologyData?.studyAvailable) {
            compliance.violations.push({
                rule: "Hydrogeology Study Required",
                message: "Hydrogeology study required for borewells deeper than 100m",
                severity: "HIGH"
            });
        }

        // Rule 4: Block category restrictions
        if (application.location?.blockCategory === "OVER_EXPLOITED") {
            compliance.warnings.push({
                rule: "Over-Exploited Block",
                message: "Application in over-exploited block requires special justification",
                severity: "HIGH"
            });
        }

        // Rule 5: All undertakings must be accepted
        const allUndertakings = [
            application.undertakings?.informationAccuracy,
            application.undertakings?.cgwaCompliance,
            application.undertakings?.meterInstallation,
            application.undertakings?.inspectionConsent,
            application.undertakings?.penaltyAcceptance
        ];

        if (!allUndertakings.every(u => u === true)) {
            compliance.violations.push({
                rule: "CGWA Undertakings",
                message: "All 5 CGWA undertakings must be accepted",
                severity: "CRITICAL"
            });
        }

        return compliance;
    }

    /**
     * Validate data consistency across sections
     */
    async validateDataConsistency(application) {
        const consistency = {
            issues: [],
            warnings: []
        };

        // Check1: Water requirement sum matches
        const section3Water = application.drinkingDomesticUse?.totalDailyDomestic || 0;
        const section4Water = application.waterRequirementBreakup?.reduce(
            (sum, item) => sum + (item.totalRequirement || 0), 0
        ) || 0;

        const totalCalculated = section3Water + section4Water;
        const totalDeclared = application.totalDailyExtraction || 0;

        if (Math.abs(totalCalculated - totalDeclared) > 1) {
            consistency.issues.push({
                field: "Total Water Requirement",
                message: `Calculated total (${totalCalculated} KL) doesn't match declared (${totalDeclared} KL)`,
                severity: "MEDIUM"
            });
        }

        // Check 2: GPS coordinates within block bounds
        if (application.location?.latitude && application.location?.longitude) {
            if (application.location.latitude < 23 || application.location.latitude > 30 ||
                application.location.longitude < 69 || application.location.longitude > 78) {
                consistency.warnings.push({
                    field: "GPS Coordinates",
                    message: "GPS coordinates appear to be outside Rajasthan state bounds",
                    severity: "MEDIUM"
                });
            }
        }

        // Check 3: Borewell capacity vs water requirement
        const totalCapacity = application.groundWaterStructures?.reduce(
            (sum, s) => sum + (s.dischargeCapacity || 0), 0
        ) || 0;

        if (totalCapacity < totalDeclared * 0.8) {
            consistency.warnings.push({
                field: "Borewell Capacity",
                message: "Total borewell capacity seems insufficient for declared water requirement",
                severity: "MEDIUM"
            });
        }

        return consistency;
    }

    /**
     * Validate calculations (fees, water balance, etc.)
     */
    async validateCalculations(application) {
        const calculations = {
            feeCalculated: false,
            waterBalanceCorrect: false,
            issues: []
        };

        // Check if fees are calculated
        if (application.feeCalculation && application.feeCalculation.totalAmount > 0) {
            calculations.feeCalculated = true;
        } else {
            calculations.issues.push("Fees not yet calculated. Please calculate fees before submission.");
        }

        // Check water balance
        const requiredWater = this.getTotalWaterRequirement(application);
        const recycledWater = application.waterRequirementBreakup?.reduce(
            (sum, item) => sum + (item.recycledWaterSTP || 0) + (item.recycledWaterETP || 0), 0
        ) || 0;

        const waterBalance = {
            totalRequired: requiredWater,
            recycled: recycledWater,
            freshGroundwater: requiredWater - recycledWater
        };

        if (recycledWater > 0) {
            calculations.waterBalanceCorrect = true;
        }

        return calculations;
    }

    /**
     * Calculate overall readiness score (0-100)
     */
    calculateReadinessScore(checklist) {
        let score = 0;
        let maxScore = 0;

        // Section completion (40 points)
        Object.values(checklist.sections).forEach(section => {
            maxScore += 40 / 6;
            if (section.complete) score += 40 / 6;
        });

        // Documents (25 points)
        maxScore += 25;
        const docScore = (checklist.documents.uploaded / checklist.documents.required) * 25;
        score += Math.min(docScore, 25);

        // CGWA Compliance (25 points)
        maxScore += 25;
        if (checklist.cgwaCompliance.violations.length === 0) {
            score += 25;
        } else {
            score += Math.max(0, 25 - (checklist.cgwaCompliance.violations.length * 5));
        }

        // Calculations (10 points)
        maxScore += 10;
        if (checklist.calculations.feeCalculated) score += 10;

        return Math.round((score / maxScore) * 100);
    }

    /**
     * Generate AI-powered suggestions
     */
    generateAISuggestions(application, validationResults) {
        const suggestions = [];

        // Priority 1: Critical blockers
        if (validationResults.checklist.cgwaCompliance.violations.length > 0) {
            suggestions.push({
                priority: "CRITICAL",
                category: "CGWA Compliance",
                message: "Your application has CGWA compliance violations that must be fixed before submission",
                action: "Fix compliance issues",
                details: validationResults.checklist.cgwaCompliance.violations
            });
        }

        // Priority 2: Incomplete sections
        const incompleteSections = Object.entries(validationResults.checklist.sections)
            .filter(([key, value]) => !value.complete)
            .map(([key, value]) => value.name);

        if (incompleteSections.length > 0) {
            suggestions.push({
                priority: "HIGH",
                category: "Application Sections",
                message: `${incompleteSections.length} section(s) are incomplete`,
                action: "Complete all sections",
                details: incompleteSections
            });
        }

        // Priority 3: Missing documents
        if (validationResults.checklist.documents.missing.length > 0) {
            suggestions.push({
                priority: "HIGH",
                category: "Documents",
                message: `${validationResults.checklist.documents.missing.length} required document(s) not uploaded`,
                action: "Upload missing documents",
                details: validationResults.checklist.documents.missing
            });
        }

        // Priority 4: Fee calculation
        if (!validationResults.checklist.calculations.feeCalculated) {
            suggestions.push({
                priority: "MEDIUM",
                category: "Fee Calculation",
                message: "Application fees have not been calculated",
                action: "Calculate fees in Section 7",
                details: ["Click 'Calculate Fees' to see your total application fee"]
            });
        }

        // Priority 5: Optimization suggestions
        if (validationResults.overallReadiness >= 70 && validationResults.overallReadiness < 90) {
            suggestions.push({
                priority: "LOW",
                category: "Optimization",
                message: "Good progress! A few improvements will increase approval chances",
                action: "Review warnings and suggestions",
                details: validationResults.checklist.dataConsistency.warnings
            });
        }

        // Priority 6: Ready to submit
        if (validationResults.canSubmit) {
            suggestions.push({
                priority: "INFO",
                category: "Submission",
                message: "✅ Your application is ready for submission!",
                action: "Click 'Submit Application' to proceed",
                details: ["All required sections completed", "All documents uploaded", "CGWA compliant"]
            });
        }

        return suggestions;
    }

    /**
     * Helper: Get total water requirement
     */
    getTotalWaterRequirement(application) {
        const domestic = application.drinkingDomesticUse?.totalDailyDomestic || 0;
        const industrial = application.waterRequirementBreakup?.reduce(
            (sum, item) => sum + (item.freshGroundWater || 0), 0
        ) || 0;
        return domestic + industrial;
    }
}

module.exports = new ApplicationValidatorService();
