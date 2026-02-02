import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';

// --- ТИПЫ ДАННЫХ ---
interface Nutrition {
  targetCalories: number;
  macros: { protein: number; fat: number; carbs: number };
}

interface ProfileData {
  gender: string;
  age: string;
  height: string;
  weight: string;
  activity: string;
  goal: string;
  nutrition?: Nutrition;
}

interface UserData {
  name: string;
  email: string;
  id?: string;
  token?: string;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null); // Храним анкету здесь

  // Форма авторизации
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Форма анкеты (начальные значения)
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('1.2'); // 1.2 = Сидячий
  const [goal, setGoal] = useState('lose'); // lose = Сушка

  // 👇 ТВОЯ ССЫЛКА (DevTunnels)
  const BASE_URL = 'https://hn8j0kqp-5000.euw.devtunnels.ms'; 

  // --- 1. АВТОРИЗАЦИЯ ---
  const handleAuth = async () => {
    const endpoint = isLoginMode ? '/api/users/login' : '/api/users';
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: !isLoginMode ? name : undefined, email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        const userData = data.user || { name: data.name, email: data.email };
        userData.token = data.token; // Сохраняем токен!
        setUser(userData);
        
        // Если при входе сервер сразу вернул профиль - сохраняем его
        if (data.profile) setProfile(data.profile);
      } else {
        Alert.alert('Ошибка', data.message);
      }
    } catch (error) { Alert.alert('Ошибка сети', 'Проверь сервер'); }
  };

  // --- 2. СОХРАНЕНИЕ АНКЕТЫ ---
  const saveProfile = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` // Показываем паспорт
        },
        body: JSON.stringify({ gender, age, height, weight, activity, goal }),
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile); // Обновляем экран
        Alert.alert('Готово!', `Твоя норма: ${data.profile.nutrition.targetCalories} ккал`);
      }
    } catch (error) { Alert.alert('Ошибка', 'Не удалось сохранить'); }
  };

  const handleLogout = () => { setUser(null); setProfile(null); setIsLoginMode(true); };

  // === ЭКРАН 1: ФОРМА ВХОДА ===
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Body & Dry</Text>
          <Text style={styles.subtitle}>{isLoginMode ? 'Вход' : 'Регистрация'}</Text>
          {!isLoginMode && <TextInput style={styles.input} placeholder="Имя" value={name} onChangeText={setName} />}
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"/>
          <TextInput style={styles.input} placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth}>
            <Text style={styles.btnText}>{isLoginMode ? 'Войти' : 'Создать'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={{marginTop:15}}>
            <Text style={{color:'#007AFF'}}>{isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // === ЭКРАН 2: АНКЕТА (Если профиля нет) ===
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', padding: 20}}>
          <View style={styles.card}>
            <Text style={styles.title}>Заполни анкету</Text>
            <Text style={styles.subtitle}>Чтобы мы рассчитали калории</Text>

            {/* Пол */}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.optionBtn, gender === 'male' && styles.activeOption]} onPress={() => setGender('male')}>
                <Text style={gender === 'male' ? styles.activeText : styles.text}>Мужчина</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionBtn, gender === 'female' && styles.activeOption]} onPress={() => setGender('female')}>
                <Text style={gender === 'female' ? styles.activeText : styles.text}>Женщина</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Возраст (лет)" keyboardType="numeric" value={age} onChangeText={setAge} />
            <TextInput style={styles.input} placeholder="Рост (см)" keyboardType="numeric" value={height} onChangeText={setHeight} />
            <TextInput style={styles.input} placeholder="Вес (кг)" keyboardType="numeric" value={weight} onChangeText={setWeight} />

            <Text style={styles.label}>Активность:</Text>
            <View style={styles.row}>
               {/* Упрощенный выбор для теста */}
              <TouchableOpacity style={[styles.optionBtn, activity === '1.2' && styles.activeOption]} onPress={() => setActivity('1.2')}>
                <Text style={activity === '1.2' ? styles.activeText : styles.text}>Низкая</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionBtn, activity === '1.55' && styles.activeOption]} onPress={() => setActivity('1.55')}>
                <Text style={activity === '1.55' ? styles.activeText : styles.text}>Средняя</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionBtn, activity === '1.9' && styles.activeOption]} onPress={() => setActivity('1.9')}>
                <Text style={activity === '1.9' ? styles.activeText : styles.text}>Спорт</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={saveProfile}>
              <Text style={styles.btnText}>Рассчитать план</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleLogout} style={{marginTop: 15, alignSelf: 'center'}}>
               <Text style={{color: 'red'}}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // === ЭКРАН 3: РЕЗУЛЬТАТЫ (Личный кабинет) ===
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Привет, {user.name}!</Text>
        <Text style={styles.subtitle}>Твой план "Body & Dry"</Text>

        <View style={styles.resultBox}>
           <Text style={styles.bigNumber}>{profile.nutrition?.targetCalories} ккал</Text>
           <Text style={styles.resultLabel}>Цель на день</Text>
        </View>

        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{profile.nutrition?.macros.protein}г</Text>
            <Text style={styles.macroLabel}>Белки</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{profile.nutrition?.macros.fat}г</Text>
            <Text style={styles.macroLabel}>Жиры</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroVal}>{profile.nutrition?.macros.carbs}г</Text>
            <Text style={styles.macroLabel}>Углеводы</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#FF3B30', marginTop: 30}]} onPress={handleLogout}>
          <Text style={styles.btnText}>Выйти</Text>
        </TouchableOpacity>
        
        {/* Кнопка сброса (для тестов) */}
        <TouchableOpacity style={{marginTop:15}} onPress={() => setProfile(null)}>
            <Text style={{color:'#666'}}>Изменить параметры</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', backgroundColor: 'white', padding: 25, borderRadius: 20, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { height: 50, backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  btnPrimary: { height: 50, backgroundColor: '#007AFF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  // Стили для анкеты
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  optionBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  activeOption: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  text: { color: '#333' },
  activeText: { color: 'white', fontWeight: 'bold' },
  label: { marginBottom: 10, fontWeight: 'bold', color: '#555' },

  // Стили результатов
  resultBox: { backgroundColor: '#eef6ff', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  bigNumber: { fontSize: 36, fontWeight: 'bold', color: '#007AFF' },
  resultLabel: { fontSize: 14, color: '#555', textTransform: 'uppercase', marginTop: 5 },
  macrosContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  macroLabel: { fontSize: 12, color: '#888' }
});