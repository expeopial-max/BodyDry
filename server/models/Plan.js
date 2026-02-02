const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  name: { type: String, default: "План Сушки (8 недель)" },
  
  // Общие параметры на старте
  startStats: {
    weight: Number,
    targetCalories: Number
  },

  // Программа по неделям
  weeks: [{
    weekNumber: Number,
    title: String,        // Напр: "Неделя 1-2: Вход в режим"
    description: String,  // Советы
    dailyCalories: Number,
    macros: {
      protein: Number,
      fat: Number,
      carbs: Number
    }
  }]
});

module.exports = mongoose.model('Plan', planSchema);