const logger = require("../utils/logger");

/**
 * Pump Calculation Service
 * Calculates estimated discharge rates for groundwater abstraction structures
 */
class PumpCalculationService {
    /**
     * Calculate pump discharge rate
     * Formula: Q (L/s) = (75 * HP * Efficiency) / Head (m)
     * 
     * @param {number} hp - Pump capacity in Horsepower
     * @param {number} head - Depth/Head in meters
     * @param {number} efficiency - Pump efficiency (0.0 to 1.0), default 0.6 (60%)
     */
    calculateDischarge(hp, head, efficiency = 0.6) {
        try {
            // Validations
            if (!hp || hp <= 0) {
                throw {
                    statusCode: 400,
                    code: "INVALID_INPUT",
                    message: "Pump capacity (HP) must be greater than 0"
                };
            }
            if (!head || head <= 0) {
                throw {
                    statusCode: 400,
                    code: "INVALID_INPUT",
                    message: "Depth/Head must be greater than 0"
                };
            }

            // Normalize efficiency
            // If user sends 60, treat as 0.6
            // If user sends 0.6, treat as 0.6
            let eff = efficiency;
            if (efficiency > 1) {
                eff = efficiency / 100;
            }

            if (eff <= 0 || eff > 1) {
                eff = 0.6; // Fallback to standard 60% if invalid
            }

            // Calculation
            // 1 HP = 75 kg-m/s
            // Power (HP) = (Q * H) / (75 * Efficiency)
            // Therefore, Q (L/s) = (75 * HP * Efficiency) / H

            const dischargeLPS = (75 * hp * eff) / head;

            // Conversions
            const dischargeLPM = dischargeLPS * 60; // Liters per Minute
            const dischargeCMD = (dischargeLPS * 3600 * 24) / 1000; // Cubic Meters per Day (running 24 hrs - theoretical)
            const dischargeM3Hr = (dischargeLPS * 3600) / 1000; // Cubic Meters per Hour

            return {
                inputs: {
                    pumpCapacityHP: hp,
                    headMeters: head,
                    efficiency: eff,
                    efficiencyPercentage: `${(eff * 100).toFixed(0)}%`
                },
                results: {
                    dischargeLPS: parseFloat(dischargeLPS.toFixed(2)), // Liters per Second
                    dischargeLPM: parseFloat(dischargeLPM.toFixed(2)), // Liters per Minute
                    dischargeM3Hr: parseFloat(dischargeM3Hr.toFixed(2)), // Cubic meters per hour
                },
                formula: "Q (L/s) = (75 * HP * Efficiency) / Head (m)"
            };

        } catch (error) {
            logger.error("Error calculating pump discharge", error);
            throw error;
        }
    }
}

module.exports = new PumpCalculationService();
