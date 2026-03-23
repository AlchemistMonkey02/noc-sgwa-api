const MasterData = require("./master-data.model");
const ApplicationType = require("./application-type.model");
const ApplicationSubType = require("./application-sub-type.model");
const ProjectCategory = require("./project-category.model");
const mongoose = require("mongoose");

class MasterDataController {
    async getByType(req, res, next, type) {
        try {
            const data = await MasterData.find({ type, isActive: true })
                .sort({ displayOrder: 1, label: 1 })
                .select("code label -_id");

            res.status(200).json({
                success: true,
                data,
                message: "Master data retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    getApplicationTypes = async (req, res, next) => {
        try {
            const data = await ApplicationType.find({ isActive: true }).sort({ id: 1 });
            res.status(200).json({
                success: true,
                data,
                message: "Application types retrieved successfully"
            });
        } catch (error) { next(error); }
    }

    getApplicationSubTypes = async (req, res, next) => {
        try {
            const { appTypeCode } = req.query;
            let query = { isActive: true };
            if (appTypeCode) {
                query.appTypeCode = appTypeCode;
            }

            let data = await ApplicationSubType.find(query).sort({ appSubTypeCode: 1 });
            
            // Fallback 1: try numeric if was string
            if (data.length === 0 && appTypeCode && !isNaN(appTypeCode)) {
                query.appTypeCode = Number(appTypeCode);
                data = await ApplicationSubType.find(query).sort({ appSubTypeCode: 1 });
            }

            // Fallback 2: If appTypeCode looks like a name (e.g. "Industry")
            if (data.length === 0 && appTypeCode && isNaN(appTypeCode)) {
                const appType = await ApplicationType.findOne({ 
                    name: { $regex: new RegExp(`^${appTypeCode}$`, 'i') } 
                });
                if (appType) {
                    query.appTypeCode = appType.id; // try their ID (Mixed)
                    data = await ApplicationSubType.find(query).sort({ appSubTypeCode: 1 });
                }
            }

            res.status(200).json({
                success: true,
                data,
                message: "Application sub-types retrieved successfully"
            });
        } catch (error) { next(error); }
    }

    getProjectCategories = async (req, res, next) => {
        try {
            const { appSubTypeCode, appTypeCode } = req.query;
            let query = { isActive: true };
            if (appSubTypeCode) query.appSubTypeCode = appSubTypeCode;
            if (appTypeCode) query.appTypeCode = appTypeCode;

            let data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
            
            // Fallback 1: Numeric
            if (data.length === 0 && (appSubTypeCode || appTypeCode)) {
                if (appSubTypeCode && !isNaN(appSubTypeCode)) query.appSubTypeCode = Number(appSubTypeCode);
                if (appTypeCode && !isNaN(appTypeCode)) query.appTypeCode = Number(appTypeCode);
                data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
            }

            // Fallback 2: Name based (search by AppType name first if needed)
            if (data.length === 0 && appTypeCode && isNaN(appTypeCode)) {
                 const appType = await ApplicationType.findOne({ 
                    name: { $regex: new RegExp(`^${appTypeCode}$`, 'i') } 
                });
                if (appType) {
                    query.appTypeCode = appType.id;
                    data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
                }
            }

            // Fallback 3: SubType name based
            if (data.length === 0 && appSubTypeCode && isNaN(appSubTypeCode)) {
                const subType = await ApplicationSubType.findOne({ 
                   name: { $regex: new RegExp(`^${appSubTypeCode}$`, 'i') } 
                });
                if (subType) {
                   query.appSubTypeCode = subType.appSubTypeCode;
                   data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
                }
            }

            res.status(200).json({
                success: true,
                data,
                message: "Project categories retrieved successfully"
            });
        } catch (error) { next(error); }
    }

    getGeologyTypes = (req, res, next) => this.getByType(req, res, next, "GEOLOGY_TYPE");
    getWaterQualityTypes = (req, res, next) => this.getByType(req, res, next, "WATER_QUALITY_TYPE");
    // Link "Project Types" to the new Project Categories data
    getProjectTypes = async (req, res, next) => {
        try {
            const { appSubTypeCode, appTypeCode } = req.query;
            let query = { isActive: true };
            if (appSubTypeCode) query.appSubTypeCode = appSubTypeCode;
            if (appTypeCode) query.appTypeCode = appTypeCode;

            let data = await ProjectCategory.find(query).sort({ categoryCode: 1 });

            // Fallback 1: Numeric
            if (data.length === 0 && (appSubTypeCode || appTypeCode)) {
                if (appSubTypeCode && !isNaN(appSubTypeCode)) query.appSubTypeCode = Number(appSubTypeCode);
                if (appTypeCode && !isNaN(appTypeCode)) query.appTypeCode = Number(appTypeCode);
                data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
            }

            // Fallback 2: AppType Name
            if (data.length === 0 && appTypeCode && isNaN(appTypeCode)) {
                const appType = await ApplicationType.findOne({ 
                    name: { $regex: new RegExp(`^${appTypeCode}$`, 'i') } 
                });
                if (appType) {
                    query.appTypeCode = appType.id;
                    data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
                }
            }

            // Fallback 3: SubType Name
            if (data.length === 0 && appSubTypeCode && isNaN(appSubTypeCode)) {
                const subType = await ApplicationSubType.findOne({ 
                    name: { $regex: new RegExp(`^${appSubTypeCode}$`, 'i') } 
                });
                if (subType) {
                    query.appSubTypeCode = subType.appSubTypeCode;
                    data = await ProjectCategory.find(query).sort({ categoryCode: 1 });
                }
            }

            res.status(200).json({
                success: true,
                data,
                message: "Project types retrieved successfully"
            });
        } catch (error) { next(error); }
    }
    getUtilizationPurposes = (req, res, next) => this.getByType(req, res, next, "UTILIZATION_PURPOSE");
    getMSMETypes = (req, res, next) => this.getByType(req, res, next, "MSME_TYPE");
    getOrganizationTypes = (req, res, next) => this.getByType(req, res, next, "ORGANIZATION_TYPE");

    // Updated to return static data for consistency
    getMeterTypes = (req, res, next) => this.getByType(req, res, next, "METER_TYPE");

    getAreaCategories = (req, res, next) => this.getByType(req, res, next, "AREA_CATEGORY");

    // DB-Backed APIs for Digital Flow Meter
    getMeterManufacturers = (req, res, next) => this.getByType(req, res, next, "METER_MANUFACTURER");
    getTelemetryProviders = (req, res, next) => this.getByType(req, res, next, "TELEMETRY_PROVIDER");
    getBISStandards = (req, res, next) => this.getByType(req, res, next, "BIS_STANDARD");
    getNABLLabs = (req, res, next) => this.getByType(req, res, next, "NABL_LAB");
    getSectorTypes = (req, res, next) => this.getByType(req, res, next, "SECTOR_TYPE");

    getMeterModels = async (req, res, next) => {
        try {
            const { manufacturer } = req.query;
            const query = { type: "METER_MODEL", isActive: true };

            // Filter by manufacturer if provided
            if (manufacturer) {
                query["metadata.manufacturer"] = manufacturer;
            }

            const data = await MasterData.find(query)
                .sort({ label: 1 })
                .select("code label metadata -_id");

            res.status(200).json({
                success: true,
                data,
                message: "Meter models retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    getSampleSerialNumbers = async (req, res, next) => {
        try {
            const { manufacturer } = req.query;
            const query = { type: "METER_SERIAL_NUMBER", isActive: true };

            // Filter by manufacturer if provided
            if (manufacturer) {
                query["metadata.manufacturer"] = manufacturer;
            }

            const data = await MasterData.find(query)
                .sort({ label: 1 })
                .select("code label metadata -_id");

            res.status(200).json({
                success: true,
                data,
                message: "Sample serial numbers retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Consolidate all flow meter master data for the frontend form
     */
    getFlowMeterConfig = async (req, res, next) => {
        try {
            const [manufacturers, telemetryProviders, bisStandards, meterTypes, serialNumbers, meterModels, nablLabs] = await Promise.all([
                MasterData.find({ type: "METER_MANUFACTURER", isActive: true }).select("code label -_id").sort({ label: 1 }),
                MasterData.find({ type: "TELEMETRY_PROVIDER", isActive: true }).select("code label -_id").sort({ label: 1 }),
                MasterData.find({ type: "BIS_STANDARD", isActive: true }).select("code label -_id").sort({ label: 1 }),
                MasterData.find({ type: "METER_TYPE", isActive: true }).select("code label -_id").sort({ label: 1 }),
                MasterData.find({ type: "METER_SERIAL_NUMBER", isActive: true }).select("code label -_id").sort({ label: 1 }),
                MasterData.find({ type: "METER_MODEL", isActive: true }).select("code label metadata -_id").sort({ label: 1 }),
                MasterData.find({ type: "NABL_LAB", isActive: true }).select("code label -_id").sort({ label: 1 })
            ]);

            // If Meter Types are missing in DB, provide default
            const finalMeterTypes = meterTypes.length > 0 ? meterTypes : [
                { code: "DIGITAL_FLOW_METER_WITH_TELEMETRY", label: "Digital Flow Meter with Telemetry" }
            ];

            res.status(200).json({
                success: true,
                data: {
                    manufacturers,
                    telemetryProviders,
                    bisStandards,
                    meterTypes: finalMeterTypes,
                    serialNumbers,
                    meterModels,
                    nablLabs
                },
                message: "Flow meter configuration retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new MasterDataController();
