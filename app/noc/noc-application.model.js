const mongoose = require("mongoose");

const NOCApplicationSchema = new mongoose.Schema(
    {
        applicationId: {
            type: String,
            // required: true, // Removed
            unique: true,
        },
        applicationNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        trackingId: {
            type: String,
            unique: true,
            sparse: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
        },
        applicationCategory: {
            type: String,
            default: "WITHDRAWAL",
        },
        sectorType: {
            type: String,
        },
        validityPeriodRequested: {
            type: Number,
            default: 3,
        },
        applicationType: {
            type: String,
        },
        applicationSubType: {
            type: String,
        },
        projectType: {
            type: String,
        },
        waterQualityType: {
            type: String,
        },
        groundWaterUtilizationFor: {
            type: String,
        },
        dateOfCommencement: {
            type: Date,
        },
        existingNOCStatus: {
            type: String,
            default: "NO",
        },
        oldNOCNumber: {
            type: String,
        },
        status: {
            type: String,
            default: "DRAFT",
            index: true,
        },

        // Exemption Fields
        isExempted: {
            type: Boolean,
            default: false,
        },
        exemptionEligible: {
            type: Boolean,
            default: false,
        },
        exemptionDetails: {
            type: Object, // Stores exact agricultural details, KLD, etc.
        },

        // 3-Tier Approval Flow Tracking
        approvalFlow: {
            dgo: {
                assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedAt: Date,
                reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reviewedAt: Date,
                status: { type: String, default: 'PENDING' },
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
                status: { type: String, default: 'PENDING' },
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
                status: { type: String, default: 'PENDING' },
                remarks: String,
                finalDecision: String,
                nocNumber: String,
                nocIssuedAt: Date
            }
        },

        // Location Details
        location: {
            stateId: { type: String },
            districtId: { type: String },
            blockId: { type: String },
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
            projectName: { type: String },
            industryType: String,
            projectDescription: String,

            landUseDetails: {
                totalArea: Number,
                rooftopArea: Number,
                pavedArea: Number,
                greenBeltArea: Number,
                openArea: Number,
            },

            landArea: Number,
            builtUpArea: Number,
            openLandArea: Number,

            applicantName: String,
            organizationName: String,
            organizationType: String,
            designation: String,
            email: String,
            mobile: String,
            aadhaarNumber: String,
            panNumber: String,

            isMSME: {
                type: Boolean,
                default: false,
            },
            msmeDetails: {
                registrationNumber: String,
                registrationDate: Date,
                category: {
                    type: String,
                },
                certificateDocument: String,
            },

            projectStatus: {
                type: String,
            },
            nicCode: String,
            contactPersonDesignation: String,

            greenBeltPercentage: Number,

            isNearWetland: { type: Boolean, default: false },
            wetlandName: String,
            wetlandDistance: Number,

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

        // Digital Flow Meter
        digitalFlowMeter: {
            meterType: {
                type: String,
                default: "DIGITAL_FLOW_METER_WITH_TELEMETRY"
            },
            manufacturer: { type: String },
            modelNumber: { type: String },
            serialNumber: { type: String },
            bisStandards: { type: String },
            calibrationDate: Date,

            telemetry: {
                enabled: { type: Boolean, default: true },
                serviceProvider: String,
                proposedInstallationDate: { type: Date }
            },

            complianceCommitments: {
                installWithin30Days: { type: Boolean, default: false },
                maintainTelemetry: { type: Boolean, default: false },
                submitDailyData: { type: Boolean, default: false },
                penaltyAwareness: { type: Boolean, default: false },
                maintainLogbook: { type: Boolean, default: false }
            }
        },

        // Communication Address
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

        // Drinking & Domestic Use
        drinkingDomesticUse: {
            numberOfWorkers: { type: Number, default: 0 },
            numberOfResidents: { type: Number, default: 0 },
            dailyRequirementPerPerson: { type: Number, default: 135 },
            totalDailyDomestic: Number,
            totalAnnualDomestic: Number
        },

        // Water Requirement Breakup
        waterRequirementBreakup: [{
            activityType: {
                type: String,
            },
            totalRequirement: Number,
            freshGroundWater: Number,
            surfaceWater: Number,
            recycledWaterSTP: Number,
            recycledWaterETP: Number,
            municipalSupply: Number,
            remarks: String
        }],

        // Ground Water Structures
        groundWaterStructures: [{
            structureType: {
                type: String,
            },
            category: {
                type: String,
            },
            yearOfConstruction: Number,
            depth: Number,
            diameter: Number,
            depthToWaterLevel: Number,
            discharge: Number,

            waterMeterFitted: {
                type: Boolean,
                default: false
            },

            pumpDetails: {
                pumpType: {
                    type: String,
                    default: "SUBMERSIBLE"
                },
                capacityHP: Number,
            },

            latitude: Number,
            longitude: Number,
            status: String,
            horsepower: Number,
        }],

        // Enhanced Water Requirements
        waterRequirement: {
            purpose: { type: String },

            totalRequirement: Number,
            freshWaterRequirement: Number,
            recycledWaterUsage: Number,

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

            proposedExtraction: {
                numberOfBorewells: { type: Number },
                borewellDetails: [{
                    depth: Number,
                    diameter: Number,
                    dischargeCapacity: Number,
                    operatingHours: Number,
                    operatingDays: Number,
                }],
                totalDailyExtraction: Number,
                totalAnnualExtraction: Number,
            },

            pumpingDetails: {
                pumpType: {
                    type: String,
                    default: "SUBMERSIBLE"
                },
                capacityHP: Number,
                dischargeRate: Number
            },

            purposeWiseBreakup: {
                drinking: { type: Number, default: 0 },
                industrial: { type: Number, default: 0 },
                cooling: { type: Number, default: 0 },
                construction: { type: Number, default: 0 },
                irrigation: { type: Number, default: 0 },
                other: { type: Number, default: 0 },
            },

            dailyRequirement: Number,
            sourceType: {
                type: String,
            },
            depth: Number,
            pumpCapacity: Number,
        },

        // Hydrogeological Information
        hydrogeology: {
            aquiferType: {
                type: String,
            },
            aquiferDepthRange: {
                from: Number,
                to: Number,
            },
            staticWaterLevel: Number,
            dynamicWaterLevel: Number,
            drawdown: Number,
            recoveryRate: Number,
            waterQuality: {
                type: String,
            },
            pumpingTest: {
                conducted: { type: Boolean, default: false },
                duration: Number,
                dischargeRate: Number,
                conductedBy: String,
                reportDate: Date,
                documentId: String,
            },
        },

        // Water Conservation Measures
        conservationMeasures: {
            rainwaterHarvesting: {
                implemented: { type: Boolean },
                structures: [{
                    type: {
                        type: String,
                    },
                    capacity: Number,
                    rechargeArea: Number,
                    location: String,
                }],
                totalRechargeCapacity: Number,
            },

            recyclingReuse: {
                planned: { type: Boolean, default: false },
                percentage: Number,
                treatmentMethod: String,
                reuseApplication: String,
            },

            waterAudit: {
                mechanism: String,
                frequency: {
                    type: String,
                },
                lastAuditDate: Date,
            },

            conservationPlanDocument: {
                uploaded: Boolean,
                documentId: String,
                uploadedAt: Date,
            },
        },

        // Undertakings & Declarations
        undertakings: {
            informationAccuracy: { type: Boolean },
            complianceAgreement: { type: Boolean },
            waterMeterInstallation: { type: Boolean },
            inspectionConsent: { type: Boolean },
            penaltyAcceptance: { type: Boolean },
            undertakingDate: Date,
            undertakingPlace: String,
            digitalSignature: String,
        },

        // Existing NOC Details
        existingNOCDetails: {
            nocNumber: String,
            issueDate: Date,
            validUpto: Date,
            issuingAuthority: String,
            approvedExtraction: Number,
            actualExtraction: Number,
            complianceStatus: {
                type: String,
            },
        },

        // Documents
        documents: [
            {
                documentType: String,
                documentId: String,
                fileName: String,
                uploadedAt: Date,

                verification: {
                    ai: {
                        verified: { type: Boolean, default: false },
                        confidence: Number,
                        verifiedAt: Date,
                        remarks: String,
                        status: { type: String, default: "PENDING" }
                    },
                    dgo: {
                        verified: { type: Boolean, default: false },
                        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                        verifiedAt: Date,
                        remarks: String,
                        status: { type: String, default: 'PENDING' }
                    },
                    sgwa: {
                        verified: { type: Boolean, default: false },
                        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                        verifiedAt: Date,
                        remarks: String,
                        status: { type: String, default: 'PENDING' }
                    },
                    enforcement: {
                        verified: { type: Boolean, default: false },
                        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                        verifiedAt: Date,
                        remarks: String,
                        status: { type: String, default: 'PENDING' }
                    }
                },

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

        // Progress Tracking
        progressTracking: {
            currentStage: {
                type: String,
            },
            timeline: [{
                stage: String,
                status: {
                    type: String,
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
        const now = new Date();
        const year = now.getFullYear();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const datePart = `${day}${month}`;
        this.applicationNumber = `Noc/${year}/${datePart}/Noc${String(count + 1).padStart(4, "0")}`;
    }
});

module.exports = mongoose.model("NOCApplication", NOCApplicationSchema);
