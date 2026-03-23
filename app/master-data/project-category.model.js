const mongoose = require("mongoose");

const projectCategorySchema = new mongoose.Schema({
    categoryCode: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    appSubTypeCode: { type: mongoose.Schema.Types.Mixed, required: true },
    appTypeCode: { type: mongoose.Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    waterBased: { type: Boolean, default: false },
    exemptionAllow: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Use the existing collection name
module.exports = mongoose.model("ProjectCategory", projectCategorySchema, "projectcategories");
