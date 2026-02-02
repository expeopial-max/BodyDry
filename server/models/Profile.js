const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gender: String,
  age: Number,
  height: Number,
  weight: Number,
  activity: String,
  goal: String,
  nutrition: {
    bmr: Number,
    tdee: Number,
    targetCalories: Number,
    macros: {
      protein: Number,
      fat: Number,
      carbs: Number
    }
  }
});

module.exports = mongoose.model('Profile', profileSchema);