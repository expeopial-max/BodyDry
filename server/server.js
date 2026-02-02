require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 🔌 Подключаем наши модели
const User = require('./models/User'); 
const Profile = require('./models/Profile');

// 🔌 Подключаем наши маршруты (из папки routes)
const productRoutes = require('./routes/productRoutes');
const diaryRoutes = require('./routes/diaryRoutes');
const planRoutes = require('./routes/planRoutes'); // <--- НОВОЕ: План сушки

// 🔌 Подключаем Middleware (Охрану)
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

// --- 🔌 ПОДКЛЮЧЕНИЕ К MONGODB (Локально) ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB подключена (Локально)'))
  .catch((err) => console.error('❌ Ошибка подключения к БД:', err));

// ============================================
//               МАРШРУТЫ API
// ============================================

// --- 1. АВТОРИЗАЦИЯ (Регистрация / Вход) ---

// Регистрация
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Проверка дубликата
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email занят' });

    // Создаем юзера
    const newUser = await User.create({ name, email, password });
    
    // Выдаем токен
    const token = jwt.sign({ id: newUser._id, name: newUser.name, email }, process.env.JWT_SECRET);
    console.log('✅ Новый юзер:', newUser.name);
    
    res.status(201).json({ user: { id: newUser._id, name: newUser.name, email: newUser.email }, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

// Вход
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (user) {
      const token = jwt.sign({ id: user._id, name: user.name, email }, process.env.JWT_SECRET);
      
      // Ищем профиль, чтобы отдать сразу
      const profile = await Profile.findOne({ userId: user._id });
      
      console.log('🔓 Вход:', user.name);
      res.json({ 
        message: 'Вход успешен', 
        user: { id: user._id, name: user.name, email: user.email }, 
        profile, 
        token 
      });
    } else {
      res.status(401).json({ message: 'Неверный email или пароль' });
    }
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление аккаунта (GDPR) - защищено токеном
app.delete('/api/users/me', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await Profile.findOneAndDelete({ userId: req.user.id });
    console.log('🗑 Аккаунт удален:', req.user.name);
    res.json({ message: 'Аккаунт успешно удален' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});


// --- 2. ПРОФИЛЬ ТЕЛА (Сохранение + Расчет) ---

// Функция расчета (можно вынести в utils)
const calculateNutrition = (data) => {
  const { gender, age, height, weight, activity, goal } = data;
  let bmr;
  // Формула Миффлина-Сан-Жеора
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  const tdee = bmr * parseFloat(activity);
  
  let targetCalories = tdee;
  if (goal === 'lose') targetCalories = tdee - 500;
  if (goal === 'gain') targetCalories = tdee + 300;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: {
      protein: Math.round((targetCalories * 0.3) / 4),
      fat: Math.round((targetCalories * 0.3) / 9),
      carbs: Math.round((targetCalories * 0.4) / 4)
    }
  };
};

app.post('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gender, age, height, weight, activity, goal } = req.body;

    const nutrition = calculateNutrition({ gender, age, height, weight, activity, goal });

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { userId, gender, age, height, weight, activity, goal, nutrition },
      { new: true, upsert: true }
    );

    console.log(`📊 Профиль обновлен: ${req.user.name}`);
    res.json({ message: 'Данные сохранены', profile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сохранения профиля' });
  }
});


// --- 3. ПОДКЛЮЧЕНИЕ НОВЫХ МОДУЛЕЙ ---
app.use('/api/products', productRoutes); // Поиск еды
app.use('/api/diary', diaryRoutes);      // Дневник питания
app.use('/api/plan', planRoutes);        // План сушки (НОВОЕ)


// ============================================
//               ЗАПУСК СЕРВЕРА
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер Body&Dry запущен на порту ${PORT}`);
  console.log(`🔗 API доступно по адресу: http://localhost:${PORT}`);
});