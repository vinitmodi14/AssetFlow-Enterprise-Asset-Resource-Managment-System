const mongoose = require("mongoose");

// Used for atomic, collision-safe auto-increment of asset tags (AF-0001, AF-0002…)
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq:  { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
