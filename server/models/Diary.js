const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Формат "2026-02-02"
  
  // Список съеденного
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,        // Копируем имя, чтобы не ломалось, если продукт удалят
    weight: Number,      // Сколько грамм съел
    mealType: {          // Тип приема пищи
      type: String, 
      enum: ['breakfast', 'lunch', 'dinner', 'snack'], 
      default: 'snack' 
    },
    // Итоговые цифры для этой порции
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number
  }],

  // Итого за весь день (кэшируем для скорости)
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Diary', diarySchema);