const path = require('path');
// Эта строка находит .env, даже если запускать скрипт из другой папки
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 

const mongoose = require('mongoose');
const Product = require('../models/Product');

// Базовый набор продуктов (на 100г)
const products = [
  { name: "Куриное филе (вареное)", calories: 113, protein: 23.6, fat: 1.9, carbs: 0.4 },
  { name: "Гречка (отварная)", calories: 110, protein: 4.2, fat: 1.1, carbs: 21.3 },
  { name: "Рис белый (отварной)", calories: 116, protein: 2.2, fat: 0.5, carbs: 24.9 },
  { name: "Яйцо куриное (1 шт)", calories: 70, protein: 6, fat: 5, carbs: 0.6 },
  { name: "Овсянка (на воде)", calories: 88, protein: 3, fat: 1.7, carbs: 15 },
  { name: "Творог 5%", calories: 121, protein: 17.2, fat: 5, carbs: 1.8 },
  { name: "Банан", calories: 89, protein: 1.1, fat: 0.3, carbs: 22.8 },
  { name: "Яблоко", calories: 52, protein: 0.3, fat: 0.2, carbs: 13.8 },
  { name: "Огурец", calories: 15, protein: 0.8, fat: 0.1, carbs: 3 },
  { name: "Помидор", calories: 20, protein: 1.1, fat: 0.2, carbs: 3.7 },
  { name: "Хлеб цельнозерновой", calories: 250, protein: 13, fat: 3.4, carbs: 40 },
  { name: "Молоко 2.5%", calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7 },
  { name: "Масло оливковое", calories: 884, protein: 0, fat: 100, carbs: 0 },
  { name: "Авокадо", calories: 160, protein: 2, fat: 14.7, carbs: 1.8 },
  { name: "Лосось (запеченный)", calories: 206, protein: 22, fat: 12, carbs: 0 },
  { name: "Протеин (скуп 30г)", calories: 120, protein: 24, fat: 1.5, carbs: 2 },
  { name: "Картофель (вареный)", calories: 82, protein: 2, fat: 0.4, carbs: 16.7 },
  { name: "Говядина (постная)", calories: 187, protein: 18.9, fat: 12.4, carbs: 0 },
  { name: "Орехи грецкие", calories: 654, protein: 15.2, fat: 65.2, carbs: 7 },
  { name: "Кефир 1%", calories: 40, protein: 3, fat: 1, carbs: 4 }
];

const seedDB = async () => {
  try {
    // 1. Подключаемся (теперь переменная точно будет найдена)
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI не найден в .env файле!");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Очищаем старые продукты
    await Product.deleteMany({ isCustom: false }); 
    console.log('🧹 Old base products removed');

    // 3. Загружаем новые
    await Product.insertMany(products);
    console.log(`🚀 Added ${products.length} products to database!`);

    // 4. Отключаемся
    mongoose.connection.close();
    console.log('👋 Connection closed');
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

seedDB();