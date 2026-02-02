const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const Profile = require('../models/Profile');
const authenticateToken = require('../middleware/authMiddleware');

// ГЕНЕРАЦИЯ ПЛАНА (POST /api/plan/generate)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    // 1. Берем данные пользователя
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Сначала заполни профиль' });

    // Базовый обмен (TDEE) без дефицита
    const maintenanceCalories = profile.nutrition.tdee; 

    // 2. Строим структуру на 8 недель
    const weeks = [];

    // --- ФАЗА 1: ВХОД (Недели 1-2) ---
    // Легкий дефицит 10%
    const phase1Cals = Math.round(maintenanceCalories * 0.90);
    for (let i = 1; i <= 2; i++) {
      weeks.push({
        weekNumber: i,
        title: "Фаза 1: Адаптация",
        description: "Плавно урезаем калории. Убираем сладкое и мучное на ночь.",
        dailyCalories: phase1Cals,
        macros: calculateMacros(phase1Cals)
      });
    }

    // --- ФАЗА 2: ЖИРОСЖИГАНИЕ (Недели 3-6) ---
    // Жесткий дефицит 20%
    const phase2Cals = Math.round(maintenanceCalories * 0.80);
    for (let i = 3; i <= 6; i++) {
      weeks.push({
        weekNumber: i,
        title: "Фаза 2: Активная сушка",
        description: "Максимальный результат. Увеличь потребление воды и зелени.",
        dailyCalories: phase2Cals,
        macros: calculateMacros(phase2Cals) // Тут можно было бы урезать угли сильнее
      });
    }

    // --- ФАЗА 3: ЗАКРЕПЛЕНИЕ (Недели 7-8) ---
    // Средний дефицит 15%
    const phase3Cals = Math.round(maintenanceCalories * 0.85);
    for (let i = 7; i <= 8; i++) {
      weeks.push({
        weekNumber: i,
        title: "Фаза 3: Результат",
        description: "Плавно выходим из диеты, чтобы вес не вернулся.",
        dailyCalories: phase3Cals,
        macros: calculateMacros(phase3Cals)
      });
    }

    // 3. Удаляем старый план (если был) и сохраняем новый
    await Plan.deleteMany({ userId: req.user.id });
    
    const newPlan = await Plan.create({
      userId: req.user.id,
      startStats: { weight: profile.weight, targetCalories: maintenanceCalories },
      weeks: weeks
    });

    res.json(newPlan);

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка генерации плана' });
  }
});

// ПОЛУЧИТЬ ТЕКУЩИЙ ПЛАН (GET /api/plan)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const plan = await Plan.findOne({ userId: req.user.id });
    if (!plan) return res.status(404).json({ message: 'План еще не создан' });
    res.json(plan);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вспомогательная функция (30% белка, 30% жира, 40% углей)
function calculateMacros(calories) {
  return {
    protein: Math.round((calories * 0.3) / 4),
    fat: Math.round((calories * 0.3) / 9),
    carbs: Math.round((calories * 0.4) / 4)
  };
}

module.exports = router;