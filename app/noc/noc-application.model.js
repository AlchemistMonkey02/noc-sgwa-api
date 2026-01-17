const mongoose = require("mongoose");

const NOCApplicationSchema = new mongoose.Schema(
    {
        applicationId: {
            type: String,
            required: true,
            unique: true,
        },
        applicationNumber: {
            type: String,
            unique: true,
            unique: true,
            sparse: true, // Only for submitted applications
        },
        // NEW: System generated simple tracking ID
        trackingId: {
            type: String,
            unique: true,
            sparse: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },

        // Company reference (REQUIRED)
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required for NOC application"],
            index: true,
        },

        // CGWA Application Category
        applicationCategory: {
            type: String,
            enum: ["WITHDRAWAL", "RECHARGE"],
            required: true,
            default: "WITHDRAWAL",
        },

        sectorType: {
            type: String,
            enum: ["INDUSTRIAL", "DOMESTIC", "IRRIGATION", "COMMERCIAL", "INFRASTRUCTURE", "MINING", "OTHER"],
            required: true,
        },

        validityPeriodRequested: {
            type: Number, // in years
            required: true,
            min: 1,
            max: 10,
            default: 3,
        },

        // Application Type
        applicationType: {
            type: String,
            required: true,
            enum: ["NEW", "RENEWAL", "AMENDMENT"],
        },
        applicationSubType: {
            type: String,
            required: true,
        },
        projectType: {
            type: String,
            required: true,
        },
        waterQualityType: {
            type: String,
            required: true,
        },
        groundWaterUtilizationFor: {
            type: String,
            required: true,
        },
        dateOfCommencement: {
            type: Date,
            required: true,
        },
        existingNOCStatus: {
            type: String,
            enum: ["YES", "NO"],
            default: "NO",
        },
        oldNOCNumber: {
            type: String,
            required: function () { return this.existingNOCStatus === "YES"; }
        },
        status: {
            type: String,
            required: true,
            enum: [
                "DRAFT",
                "SUBMITTED",

                // DGO Level
                "PENDING_DGO_REVIEW",
                "UNDER_REVIEW_DGO",
                "QUERY_RAISED_DGO",
                "APPROVED_DGO",
                "REJECTED_DGO",

                // SGWA Level
                "PENDING_SGWA_REVIEW",
                "UNDER_REVIEW_SGWA",
                "QUERY_RAISED_SGWA",
                "APPROVED_SGWA",
                "REJECTED_SGWA",

                // Enforcement Level
                "PENDING_ENFORCEMENT_REVIEW",
                "INSPECTION_SCHEDULED",
                "INSPECTED",
                "UNDER_REVIEW_ENFORCEMENT",
                "QUERY_RAISED_ENFORCEMENT",
                "APPROVED_ENFORCEMENT",
                "REJECTED_ENFORCEMENT",

                // Final States
                "NOC_ISSUED",
                "WITHDRAWN",
            ],
            default: "DRAFT",
            index: true,
        },

        // 3-Tier Approval Flow Tracking
        approvalFlow: {
            dgo: {
                assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedAt: Date,
                reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reviewedAt: Date,
                status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'QUERY'], default: 'PENDING' },
                remarks: String,
                recommendation: String,
                inspectionReport: String,
                documentsVerified: { type: Boolean, default: false }
            },
            sgwa: {
                assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedAt: Date,
                reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reviewedAt: Date,
                status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'QUERY'], default: 'PENDING' },
                remarks: String,
                recommendation: String,
                technicalReview: String,
                proposedValidityYears: Number,
                conditions: [String],
                cessAmount: Number
            },
            enforcement: {
                assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedAt: Date,
                reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reviewedAt: Date,
                inspectionScheduledAt: Date,
                inspectionCompletedAt: Date,
                inspectionReport: String,
                status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'QUERY'], default: 'PENDING' },
                remarks: String,
                finalDecision: String,
                nocNumber: String,
                nocIssuedAt: Date
            }
        },

        // Location Details
        location: {
            stateId: { type: String, required: true },
            districtId: { type: String, required: true },
            blockId: { type: String, required: true },
            tehsil: String,
            assessmentUnit: String,
            relevantBlocks: String,
            blockCategory: String,
            village: String,
            address: String,
            pincode: String,
            latitude: Number,
            longitude: Number,
            geology: String,
        },

        // Project Details
        projectDetails: {
            projectName: { type: String, required: true },
            industryType: String,
            projectDescription: String,

            // Land Use Details (Enhanced)
            landUseDetails: {
                totalArea: Number, // sq meters
                rooftopArea: Number,
                pavedArea: Number,
                greenBeltArea: Number,
                openArea: Number,
            },

            // Legacy fields mapped or kept for backward compatibility if needed
            landArea: Number,
            builtUpArea: Number,
            openLandArea: Number,

            // Applicant/Org Details
            applicantName: String,
            organizationName: String,
            organizationType: String,
            designation: String,
            email: String,
            mobile: String,
            aadhaarNumber: String,
            panNumber: String,

            // MSME Status (affects NOC exemption)
            isMSME: {
                type: Boolean,
                default: false,
            },
            msmeDetails: {
                registrationNumber: String,
                registrationDate: Date,
                category: {
                    type: String,
                    enum: ["MICRO", "SMALL", "MEDIUM"],
                },
                certificateDocument: String,
            },

            // NEW: Project Status
            projectStatus: {
                type: String,
                enum: ['NEW', 'EXISTING', 'EXPANSION']
            },
            nicCode: String,
            contactPersonDesignation: String,

            // NEW: Enhanced land details
            // totalLandArea: Number, // Replaced by landUseDetails.totalArea
            // greenBeltArea: Number, // Replaced by landUseDetails.greenBeltArea
            greenBeltPercentage: Number, // auto-calculated

            // NEW: Wetland proximity
            isNearWetland: { type: Boolean, default: false },
            wetlandName: String,
            wetlandDistance: Number, // meters

            // Green Belt (CGWA requirement)
            greenBelt: {
                implemented: { type: Boolean, default: false },
                area: Number,
                percentage: Number,
                plantationDetails: {
                    numberOfTrees: Number,
                    species: [String],
                    maintenancePlan: String,
                },
                documentId: String,
            },
        },

        // NEW: Digital Flow Meter (Mandatory for ALL NOC holders)
        digitalFlowMeter: {
            meterType: {
                type: String,
                enum: ["DIGITAL_FLOW_METER_WITH_TELEMETRY"],
                default: "DIGITAL_FLOW_METER_WITH_TELEMETRY"
            },
            manufacturer: { type: String, required: false },
            modelNumber: { type: String, required: false }, // Can be updated later
            serialNumber: { type: String, required: false },
            bisStandards: { type: String, required: false }, // e.g., IS 2373
            calibrationDate: Date,

            telemetry: {
                enabled: { type: Boolean, required: true, default: true },
                serviceProvider: String,
                proposedInstallationDate: { type: Date, required: false }
            },

            // Compliance Fields
            complianceCommitments: {
                installWithin30Days: { type: Boolean, default: false },
                maintainTelemetry: { type: Boolean, default: false },
                submitDailyData: { type: Boolean, default: false },
                penaltyAwareness: { type: Boolean, default: false },
                maintainLogbook: { type: Boolean, default: false } // Auto-generated logbook requirement
            }
        },

        // NEW: Communication Address (Section 1)
        communicationAddress: {
            addressLine1: String,
            addressLine2: String,
            addressLine3: String,
            state: String,
            district: String,
            subDistrict: String,
            pincode: String,
            sameAsProjectAddress: { type: Boolean, default: false }
        },

        // NEW: Section 3 - Drinking & Domestic Use
        drinkingDomesticUse: {
            numberOfWorkers: { type: Number, default: 0 },
            numberOfResidents: { type: Number, default: 0 },
            dailyRequirementPerPerson: { type: Number, default: 135 }, // CGWA standard liters
            totalDailyDomestic: Number, // auto-calculated (KL)
            totalAnnualDomestic: Number // auto-calculated (KL)
        },

        // NEW: Section 4 - Water Requirement Breakup (Enhanced)
        waterRequirementBreakup: [{
            activityType: {
                type: String,
                enum: [
                    'INDUSTRIAL_PROCESS',
                    'BOILER_FEED',
                    'COOLING_TOWER',
                    'DOMESTIC_DRINKING',
                    'GREENBELT_HORTICULTURE',
                    'FIREFIGHTING',
                    'CONSTRUCTION',
                    'OTHER'
                ]
            },
            totalRequirement: Number, // m³/day
            freshGroundWater: Number,
            surfaceWater: Number,
            recycledWaterSTP: Number,
            recycledWaterETP: Number,
            municipalSupply: Number,
            remarks: String
        }],



        // NEW: Section 5 - Ground Water Structures (Enhanced)
        // NEW: Section 5 - Ground Water Structures (Enhanced)
        groundWaterStructures: [{
            structureType: {
                type: String,
                enum: ['BOREWELL', 'TUBEWELL', 'DUGWELL', 'OPEN_WELL', 'DUG_CUM_BOREWELL']
            },
            category: {
                type: String,
                enum: ['EXISTING', 'PROPOSED']
            },
            // Technical Details
            yearOfConstruction: Number, // YYYY
            depth: Number, // meters
            diameter: Number, // mm
            depthToWaterLevel: Number, // mbgl
            discharge: Number, // m3/hour

            // Compliance
            waterMeterFitted: {
                type: Boolean,
                default: false
            },

            // Pump Details
            pumpDetails: {
                pumpType: {
                    type: String,
                    enum: ["SUBMERSIBLE", "CENTRIFUGAL", "OTHER"],
                    default: "SUBMERSIBLE"
                },
                capacityHP: Number, // Horsepower
            },

            // Legacy/Geo fields
            latitude: Number,
            longitude: Number,
            status: String, // Operational/Non-Operational
            horsepower: Number, // kept for legacy or redundancy
        }],

        // Enhanced Water Requirements (CGWA Compliant)
        waterRequirement: {
            purpose: { type: String, required: true },

            // Total Water Requirement Logic
            totalRequirement: Number, // Total Requirement (Fresh + Recycled)
            freshWaterRequirement: Number, // Total Fresh
            recycledWaterUsage: Number, // Total Recycled

            // Detailed Breakup
            breakup: {
                domestic: {
                    total: Number,
                    fresh: Number,
                    recycled: Number
                },
                industrial: {
                    total: Number,
                    fresh: Number,
                    recycled: Number
                },
                greenBelt: {
                    total: Number,
                    fresh: Number,
                    recycled: Number
                },
                other: {
                    total: Number,
                    fresh: Number,
                    recycled: Number,
                    description: String
                }
            },

            // Proposed extraction details
            proposedExtraction: {
                numberOfBorewells: { type: Number, required: true },
                borewellDetails: [{
                    depth: Number, // meters
                    diameter: Number, // mm
                    dischargeCapacity: Number, // LPM (Liters Per Minute)
                    operatingHours: Number, // hours per day
                    operatingDays: Number, // days per month
                }],
                totalDailyExtraction: Number, // KLD (Kiloliters Per Day)
                totalAnnualExtraction: Number, // KL per year
            },

            // Pumping Equipment Details
            pumpingDetails: {
                pumpType: {
                    type: String,
                    enum: ["SUBMERSIBLE", "CENTRIFUGAL", "OTHER"],
                    default: "SUBMERSIBLE"
                },
                capacityHP: Number, // Horsepower
                dischargeRate: Number // Optional if different from borewell capacity
            },

            // Purpose-wise breakup (Legacy/Simplified)
            purposeWiseBreakup: {
                drinking: { type: Number, default: 0 },
                industrial: { type: Number, default: 0 },
                cooling: { type: Number, default: 0 },
                construction: { type: Number, default: 0 },
                irrigation: { type: Number, default: 0 },
                other: { type: Number, default: 0 },
            },

            // Legacy fields (backward compatibility)
            dailyRequirement: Number, // MLD
            sourceType: {
                type: String,
                enum: ["BOREWELL", "TUBE_WELL", "OPEN_WELL"],
            },
            depth: Number, // meters
            pumpCapacity: Number, // HP (Legacy)
        },

        // Hydrogeological Information (CGWA MANDATORY)
        hydrogeology: {
            aquiferType: {
                type: String,
                enum: ["CONFINED", "UNCONFINED", "SEMI_CONFINED"],
            },
            aquiferDepthRange: {
                from: Number,
                to: Number,
            },
            staticWaterLevel: Number, // mbgl (meters below ground level)
            dynamicWaterLevel: Number, // mbgl
            drawdown: Number, // meters
            recoveryRate: Number, // meters per hour
            waterQuality: {
                type: String,
                enum: ["POTABLE", "NON_POTABLE", "SALINE"],
            },
            pumpingTest: {
                conducted: { type: Boolean, default: false },
                duration: Number, // hours
                dischargeRate: Number, // LPM
                conductedBy: String,
                reportDate: Date,
                documentId: String,
            },
        },

        // Water Conservation Measures (MANDATORY for CGWA)
        conservationMeasures: {
            // Rainwater Harvesting (MANDATORY if extraction > 10 KLD)
            rainwaterHarvesting: {
                implemented: { type: Boolean, required: true },
                structures: [{
                    type: {
                        type: String,
                        enum: ["ROOFTOP", "SURFACE", "RECHARGE_PIT", "RECHARGE_WELL", "PERCOLATION_TANK"],
                    },
                    capacity: Number, // liters
                    rechargeArea: Number, // sq meters
                    location: String,
                }],
                totalRechargeCapacity: Number, // KL per year
            },

            // Recycling & Reuse
            recyclingReuse: {
                planned: { type: Boolean, default: false },
                percentage: Number, // % of total water
                treatmentMethod: String,
                reuseApplication: String,
            },

            // Water Audit
            waterAudit: {
                mechanism: String,
                frequency: {
                    type: String,
                    enum: ["MONTHLY", "QUARTERLY", "ANNUALLY"],
                },
                lastAuditDate: Date,
            },

            // Conservation Plan Document
            conservationPlanDocument: {
                uploaded: Boolean,
                documentId: String,
                uploadedAt: Date,
            },
        },

        // Undertakings & Declarations (CGWA MANDATORY)
        undertakings: {
            informationAccuracy: { type: Boolean, required: true },
            complianceAgreement: { type: Boolean, required: true },
            waterMeterInstallation: { type: Boolean, required: true },
            inspectionConsent: { type: Boolean, required: true },
            penaltyAcceptance: { type: Boolean, required: true },
            undertakingDate: Date,
            undertakingPlace: String,
            digitalSignature: String,
        },

        // Existing NOC Details (for Renewal/Amendment)
        existingNOCDetails: {
            nocNumber: String,
            issueDate: Date,
            validUpto: Date,
            issuingAuthority: String,
            approvedExtraction: Number, // KLD
            actualExtraction: Number, // KLD
            complianceStatus: {
                type: String,
                enum: ["COMPLIANT", "NON_COMPLIANT", "PARTIAL"],
            },
        },

        // Documents
        documents: [
            {
                documentType: String, // E.g., AUTHORIZATION_LETTER
                documentId: String,
                fileName: String,
                uploadedAt: Date,
                isVerified: { type: Boolean, default: false },
                remarks: String
            },
        ],

        // Fees
        feeDetails: {
            baseAmount: Number,
            ecCharges: Number,
            waterBudgetCharges: Number,
            processingFee: Number,
            inspectionFee: Number,
            totalAmount: Number,
            isPaid: { type: Boolean, default: false },
            paymentId: String,
            paymentReceiptDocumentId: String,
        },

        // Assignment
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        assignedAt: Date,

        // Dates
        submittedAt: Date,
        approvedAt: Date,
        rejectedAt: Date,

        // Rejection
        rejectionReason: String,

        // NOC Certificate
        nocCertificateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NOCCertificate",
        },

        // NEW: Application Progress Tracking
        progressTracking: {
            currentStage: {
                type: String,
                enum: [
                    'SUBMITTED',
                    'DOCUMENT_VERIFICATION',
                    'TECHNICAL_REVIEW',
                    'FIELD_INSPECTION',
                    'FINAL_APPROVAL',
                    'NOC_GENERATION',
                    'COMPLETED'
                ]
            },
            timeline: [{
                stage: String,
                status: {
                    type: String,
                    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']
                },
                startedAt: Date,
                completedAt: Date,
                completedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                remarks: String
            }],
            estimatedCompletionDate: Date,
            actualCompletionDate: Date
        },

        // NEW: Section Completion Status (for 8-section flow)
        sectionCompletionStatus: {
            section1BasicDetails: { type: Boolean, default: false },
            section2LocationDetails: { type: Boolean, default: false },
            section3DrinkingDomestic: { type: Boolean, default: false },
            section4WaterBreakup: { type: Boolean, default: false },
            section5GroundWaterStructures: { type: Boolean, default: false },
            section6Attachments: { type: Boolean, default: false },
            section7GWCharges: { type: Boolean, default: false },
            section8Summary: { type: Boolean, default: false }
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
NOCApplicationSchema.index({ applicationNumber: 1 });
NOCApplicationSchema.index({ userId: 1, status: 1 });
NOCApplicationSchema.index({ "location.districtId": 1, "location.blockId": 1 });
NOCApplicationSchema.index({ assignedTo: 1, status: 1 });
NOCApplicationSchema.index({ createdAt: -1 });

// Auto-generate application number on submission
// Auto-generate application number on submission
NOCApplicationSchema.pre("save", async function () {
    if (this.isModified("status") && this.status === "SUBMITTED" && !this.applicationNumber) {
        const count = await this.constructor.countDocuments({
            applicationNumber: { $exists: true },
        });
        const year = new Date().getFullYear();
        this.applicationNumber = `NOC/RAJ/${year}/${String(count + 1).padStart(5, "0")}`;
    }
});

module.exports = mongoose.model("NOCApplication", NOCApplicationSchema);
