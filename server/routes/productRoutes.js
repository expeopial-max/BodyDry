const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authenticateToken = require('../middleware/authMiddleware'); // Создадим его отдельно ниже

// 1. Поиск продуктов (по названию)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q; // ?q=яблоко
    if (!query) return res.json([]);

    // Ищем продукты, в названии которых есть этот текст (без учета регистра)
    const products = await Product.find({ 
      name: { $regex: query, $options: 'i' } 
    }).limit(20);
    
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка поиска' });
  }
});

// 2. Добавить свой продукт
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, calories, protein, fat, carbs } = req.body;
    const newProduct = await Product.create({
      name, calories, protein, fat, carbs,
      isCustom: true,
      createdBy: req.user.id
    });
    res.status(201).json(newProduct);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка создания продукта' });
  }
});

module.exports = router;