const mongoose = require("mongoose");

const projectCategorySchema = new mongoose.Schema({
    categoryCode: { type: String, required: true, unique: true },
    appSubTypeCode: { type: String, required: true },
    appTypeCode: { type: String, required: true },
    name: { type: String, required: true },
    waterBased: { type: Boolean, default: false },
    exemptionAllow: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Use the existing collection name
module.exports = mongoose.model("ProjectCategory", projectCategorySchema, "projectcategories");
