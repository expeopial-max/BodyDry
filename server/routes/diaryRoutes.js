const express = require('express');
const router = express.Router();
const Diary = require('../models/Diary');
const Product = require('../models/Product');
const authenticateToken = require('../middleware/authMiddleware');

// 1. Получить дневник за конкретную дату
// GET /api/diary?date=2026-02-02
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Укажите дату' });

    let diary = await Diary.findOne({ userId: req.user.id, date });
    
    // Если записи нет, возвращаем пустышку (чтобы фронт не падал)
    if (!diary) {
      return res.json({ date, items: [], totals: { calories: 0, protein: 0, fat: 0, carbs: 0 } });
    }
    res.json(diary);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 2. Добавить съеденное
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { date, productId, weight, mealType } = req.body;
    
    // Находим продукт, чтобы узнать его БЖУ
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Продукт не найден' });

    // Считаем калории для введенного веса (напр. 200г)
    const factor = weight / 100;
    const itemStats = {
      productId: product._id,
      name: product.name,
      weight: Number(weight),
      mealType,
      calories: Math.round(product.calories * factor),
      protein: Math.round(product.protein * factor),
      fat: Math.round(product.fat * factor),
      carbs: Math.round(product.carbs * factor)
    };

    // Ищем дневник за этот день или создаем новый
    let diary = await Diary.findOne({ userId: req.user.id, date });
    if (!diary) {
      diary = new Diary({ userId: req.user.id, date, items: [], totals: {} });
    }

    // Добавляем запись
    diary.items.push(itemStats);

    // Пересчитываем ИТОГО за день
    diary.totals.calories += itemStats.calories;
    diary.totals.protein += itemStats.protein;
    diary.totals.fat += itemStats.fat;
    diary.totals.carbs += itemStats.carbs;

    await diary.save();
    res.json(diary);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка добавления' });
  }
});

// 3. Удалить запись (если случайно добавил)
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { date } = req.body; // Нужна дата, чтобы найти документ
    const diary = await Diary.findOne({ userId: req.user.id, date });
    
    if (!diary) return res.status(404).json({ message: 'Запись не найдена' });

    // Находим удаляемый элемент
    const itemIndex = diary.items.findIndex(i => i._id.toString() === req.params.itemId);
    if (itemIndex > -1) {
      const item = diary.items[itemIndex];
      
      // Вычитаем из итогов
      diary.totals.calories -= item.calories;
      diary.totals.protein -= item.protein;
      diary.totals.fat -= item.fat;
      diary.totals.carbs -= item.carbs;

      // Удаляем из массива
      diary.items.splice(itemIndex, 1);
      await diary.save();
    }

    res.json(diary);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

module.exports = router;