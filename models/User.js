const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Имя обязательно
  email: { type: String, required: true, unique: true }, // Почта уникальна
  password: { type: String, required: true }, // Пароль обязателен
  isAdmin: { type: Boolean, default: false, required: true }, // Админ или нет
}, {
  timestamps: true // Автоматически создаст поля: когда создан и когда обновлен
});

// Этот код сработает ПЕРЕД (pre) сохранением пользователя
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  // Шифруем пароль ("солим" его 10 раз)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Метод для сверки паролей (при входе в систему)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;