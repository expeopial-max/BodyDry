const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Регистрация нового пользователя
// @route   POST /api/users
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Проверяем, есть ли уже такой пользователь в базе
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // 2. Создаем нового пользователя
    const user = await User.create({
      name,
      email,
      password,
    });

    // 3. Если создался успешно — отправляем данные обратно клиенту
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id), // Выдаем токен сразу при регистрации
      });
    } else {
      res.status(400).json({ message: 'Неверные данные пользователя' });
    }
  } catch (error) {
    // Если база отключена (как сейчас на работе), мы попадем сюда
    console.error(error); 
    res.status(500).json({ message: 'Ошибка сервера (возможно, нет подключения к БД)' });
  }
});

module.exports = router;