
const BlockClassification = require("./app/eligibility/rules/block-classification.rule");

const district = "Jaipur";
const block = "Sanganer";

console.log(`Testing district: ${district}, block: ${block}`);
console.log(`Available districts: ${JSON.stringify(BlockClassification.getDistricts())}`);

const category = BlockClassification.getBlockCategory(district, block);
console.log(`Result for ${district}/${block}:`, category);

// Test case sensitivity
const blockLower = "sanganer";
const categoryLower = BlockClassification.getBlockCategory(district, blockLower);
console.log(`Result for ${district}/${blockLower}:`, categoryLower);
