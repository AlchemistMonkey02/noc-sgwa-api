const mongoose = require("mongoose");

const applicationSubTypeSchema = new mongoose.Schema({
    appSubTypeCode: { type: String, required: true, unique: true },
    appTypeCode: { type: String, required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Use the existing collection name
module.exports = mongoose.model("ApplicationSubType", applicationSubTypeSchema, "applicationsubtypes");
