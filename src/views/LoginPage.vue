<template>
  <div class="login-page">
    <h2>Вхід до Системи</h2>
    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Пароль:</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <div v.if="error" class="error-message">
        {{ error }}
      </div>
      <div v.if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Вхід...' : 'Увійти' }}
      </button>
    </form>
    <p class="register-link">
      Немає акаунту? <router-link to="/register">Зареєструватися</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Для перенаправлення після успішного входу
import { loginUser } from '../services/apiService';
import type { UserLoginDto, LoginResponseDto } from '../dtos/UserDtos'; // Або AuthDtos
import { useUserStore } from '../stores/userStore';
import { nextTick } from 'vue';

const userStore = useUserStore();

const email = ref<string>('');
const password = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  successMessage.value = null;

  if (!email.value || !password.value) {
    error.value = 'Будь ласка, заповніть всі поля.';
    loading.value = false;
    return;
  }

  const loginData: UserLoginDto = {
    email: email.value,
    password: password.value,
  };


  try {
        const response: LoginResponseDto = await loginUser(loginData);
        successMessage.value = `Вхід успішний! Вітаємо, ${response.fullName || response.email}!`;
        
        console.log('LOGIN PAGE - Response Token:', response.token); // <--- ДОДАЙ ЦЕЙ LOG

        // ЗБЕРІГАЄМО ДАНІ КОРИСТУВАЧА
        if (response.token) { // Перевіряємо, чи токен існує
            localStorage.setItem('user-token', response.token);
        } else {
            console.error('LOGIN PAGE - Token is missing in response!');
        }
        // Завжди зберігаємо user-info, навіть якщо токен відсутній, для дебагу
        localStorage.setItem('user-info', JSON.stringify({
            userID: response.userID, 
            email: response.email, 
            fullName: response.fullName
        }));

        userStore.setUser({ 
          userID: response.userID, 
          email: response.email, 
          fullName: response.fullName,
          token: response.token // Передаємо токен сюди
        });

        console.log('LOGIN PAGE - UserStore after setUser:', JSON.stringify(userStore.currentUser)); // <--- ДОДАЙ ЦЕЙ LOG
        console.log('LOGIN PAGE - IsAuthenticated after setUser:', userStore.isAuthenticated); // <--- ДОДАЙ ЦЕЙ LOG
        console.log('LOGIN PAGE - Token in localStorage after setItem:', localStorage.getItem('user-token')); // <--- ДОДАЙ ЦЕЙ LOG


        await nextTick(); 

        const redirectPath = router.currentRoute.value.query.redirect as string || '/dashboard';
        router.push(redirectPath);

      } catch (err: any) {
    if (err.response) {
      // Помилка від API (наприклад, 400, 401)
      if (err.response.status === 401 || err.response.status === 400) {
        error.value = err.response.data?.message || err.response.data?.title || 'Неправильний email або пароль.';
      } else {
        error.value = `Помилка сервера: ${err.response.status} - ${err.response.data?.message || 'Спробуйте пізніше.'}`;
      }
    } else if (err.request) {
      // Запит був зроблений, але відповідь не отримана (проблема з мережею)
      error.value = 'Не вдалося підключитися до сервера. Перевірте ваше інтернет-з\'єднання.';
    } else {
      // Інша помилка
      error.value = 'Виникла невідома помилка під час входу.';
    }
    console.error('Login failed:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-form .form-group {
  margin-bottom: 15px;
}

.login-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.login-form input[type="email"],
.login-form input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Важливо для правильного розрахунку ширини */
}

.error-message {
  color: red;
  background-color: #ffebee;
  border: 1px solid red;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
}
.success-message {
  color: green;
  background-color: #e8f5e9;
  border: 1px solid green;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.login-form button {
  width: 100%;
  padding: 10px 15px;
  background-color: #3498db; /* Синій колір для кнопки */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.login-form button:disabled {
  background-color: #a9cce3;
  cursor: not-allowed;
}

.login-form button:hover:not(:disabled) {
  background-color: #2980b9;
}

.register-link {
  text-align: center;
  margin-top: 20px;
}
</style>