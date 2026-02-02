const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Название (напр. "Гречка")
  calories: { type: Number, required: true }, // Калории на 100г
  protein: { type: Number, required: true },  // Белки
  fat: { type: Number, required: true },      // Жиры
  carbs: { type: Number, required: true },    // Углеводы
  isCustom: { type: Boolean, default: false }, // false = из общей базы, true = создал юзер
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Кто создал (если кастомное)
});

module.exports = mongoose.model('Product', productSchema);