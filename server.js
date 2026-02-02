require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// --- 💾 ВРЕМЕННАЯ ПАМЯТЬ ---
let users = [];    
let profiles = []; 

// --- 🧮 ЛОГИКА ДИЕТОЛОГА (Расчет КБЖУ) ---
const calculateNutrition = (data) => {
  const { gender, age, height, weight, activity, goal } = data;
  
  // 1. Считаем BMR (Базовый обмен) - Формула Миффлина-Сан-Жеора
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 2. Умножаем на активность (TDEE)
  // activity: 1.2 (сидячий), 1.375 (легкий), 1.55 (средний), 1.725 (высокий), 1.9 (атлет)
  const tdee = bmr * parseFloat(activity);

  // 3. Корректируем под цель
  let targetCalories = tdee;
  if (goal === 'lose') targetCalories = tdee - 500; // Дефицит (Сушка)
  if (goal === 'gain') targetCalories = tdee + 300; // Профицит (Масса)

  // 4. Считаем БЖУ (Пропорция 30/30/40 для баланса, можно менять под сушку)
  // 1г белка = 4 ккал, 1г жира = 9 ккал, 1г углей = 4 ккал
  const protein = Math.round((targetCalories * 0.3) / 4);
  const fat = Math.round((targetCalories * 0.3) / 9);
  const carbs = Math.round((targetCalories * 0.4) / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: { protein, fat, carbs }
  };
};

// --- 🔐 AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет доступа' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Токен недействителен' });
    req.user = user;
    next();
  });
};

const generateToken = (id, name, email) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- ROUTES ---

app.post('/api/users', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email занят' });

  const newUser = { id: Date.now().toString(), name, email, password };
  users.push(newUser);
  const token = generateToken(newUser.id, newUser.name, newUser.email);
  res.status(201).json({ user: { id: newUser.id, name: newUser.name, email: newUser.email }, token });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const token = generateToken(user.id, user.name, user.email);
    
    // Сразу ищем профиль, чтобы отдать его при входе
    const userProfile = profiles.find(p => p.userId === user.id);

    res.json({ 
      message: 'Вход успешен', 
      user: { id: user.id, name: user.name, email: user.email }, 
      profile: userProfile || null, // Отдаем профиль или null
      token 
    });
  } else {
    res.status(401).json({ message: 'Неверные данные' });
  }
});

// СОХРАНЕНИЕ АНКЕТЫ + РАСЧЕТ
app.post('/api/users/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { gender, age, height, weight, activity, goal } = req.body;

  // Запускаем математику
  const nutritionResults = calculateNutrition({ gender, age, height, weight, activity, goal });

  const profileData = {
    userId,
    gender, age, height, weight, activity, goal,
    nutrition: nutritionResults, // Сохраняем рассчитанные цифры
    updatedAt: new Date()
  };

  const existingIndex = profiles.findIndex(p => p.userId === userId);
  if (existingIndex >= 0) {
    profiles[existingIndex] = profileData;
  } else {
    profiles.push(profileData);
  }

  console.log(`📊 Рассчитано для ${req.user.name}: ${nutritionResults.targetCalories} ккал`);
  res.json({ message: 'Данные сохранены', profile: profileData });
});

// ПОЛУЧЕНИЕ ПРОФИЛЯ
app.get('/api/users/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const profile = profiles.find(p => p.userId === userId);
  if (profile) res.json(profile);
  else res.status(404).json({ message: 'Анкета пуста' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер Body&Dry (v2 Math) запущен на порту ${PORT}`);
});