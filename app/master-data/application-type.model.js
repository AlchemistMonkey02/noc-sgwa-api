const mongoose = require("mongoose");

const applicationTypeSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Use the existing collection name
module.exports = mongoose.model("ApplicationType", applicationTypeSchema, "applicationtypes");
