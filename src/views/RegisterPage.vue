<template>
  <div class="register-page">
    <h2>Реєстрація Нового Користувача</h2>
    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="fullName">Повне ім'я (опціонально):</label>
        <input type="text" id="fullName" v-model.trim="fullName" />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model.trim="email" required />
      </div>
      <div class="form-group">
        <label for="password">Пароль:</label>
        <input type="password" id="password" v-model="password" required />
        <small v-if="password && password.length < 6" class="form-text-error">Пароль має містити щонайменше 6 символів.</small>
      </div>
      <div class="form-group">
        <label for="confirmPassword">Підтвердіть Пароль:</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required />
        <small v-if="password && confirmPassword && password !== confirmPassword" class="form-text-error">Паролі не співпадають.</small>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <button type="submit" :disabled="loading || !isFormValid">
        {{ loading ? 'Реєстрація...' : 'Зареєструватися' }}
      </button>
    </form>
    <p class="login-link">
      Вже маєте акаунт? <router-link to="/login">Увійти</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '../services/apiService';
import type { UserForCreationDto, UserDto } from '../dtos/UserDtos';

const fullName = ref<string | undefined>(undefined); // Опціональне поле
const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');

const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const router = useRouter();

const isFormValid = computed(() => {
  return email.value && 
         password.value && 
         password.value.length >= 6 &&
         confirmPassword.value && 
         password.value === confirmPassword.value;
});

const handleRegister = async () => {
  if (!isFormValid.value) {
    error.value = "Будь ласка, виправте помилки у формі.";
    return;
  }

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  const userData: UserForCreationDto = {
    email: email.value,
    password: password.value,
    fullName: fullName.value || undefined, // Надсилаємо undefined, якщо поле порожнє
  };

  try {
    const createdUser: UserDto = await registerUser(userData);
    successMessage.value = `Реєстрація успішна для ${createdUser.email}! Тепер ви можете увійти.`;
    
    // Очистити форму
    fullName.value = undefined;
    email.value = '';
    password.value = '';
    confirmPassword.value = '';

    // Перенаправити на сторінку входу через кілька секунд
    setTimeout(() => {
      router.push('/login');
    }, 3000);

  } catch (err: any) {
    if (err.response) {
      // Помилки від API
      if (err.response.data && typeof err.response.data === 'object') {
        // Спроба отримати помилки валідації з ASP.NET Core (якщо повертається ProblemDetails)
        if (err.response.data.errors) {
          const validationErrors = err.response.data.errors;
          let errorMessages = [];
          for (const key in validationErrors) {
            if (validationErrors[key] && validationErrors[key].length > 0) {
              errorMessages.push(validationErrors[key].join(' '));
            }
          }
          error.value = errorMessages.join('; ') || 'Помилка валідації.';
        } else if (err.response.data.title || err.response.data.message) {
            error.value = err.response.data.title || err.response.data.message;
        } else {
             error.value = `Помилка сервера: ${err.response.status}. Спробуйте пізніше.`;
        }
      } else if (typeof err.response.data === 'string') {
         error.value = err.response.data;
      } else {
        error.value = `Помилка сервера: ${err.response.status}. Спробуйте пізніше.`;
      }
    } else if (err.request) {
      error.value = 'Не вдалося підключитися до сервера. Перевірте ваше інтернет-з\'єднання.';
    } else {
      error.value = 'Виникла невідома помилка під час реєстрації.';
    }
    console.error('Registration failed:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  max-width: 450px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.register-form .form-group {
  margin-bottom: 15px;
}

.register-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.register-form input[type="email"],
.register-form input[type="password"],
.register-form input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-text-error {
    display: block;
    font-size: 0.8em;
    color: red;
    margin-top: 3px;
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

.register-form button {
  width: 100%;
  padding: 10px 15px;
  background-color: #27ae60; /* Зелений колір для кнопки реєстрації */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.register-form button:disabled {
  background-color: #a3e4b7;
  cursor: not-allowed;
}

.register-form button:hover:not(:disabled) {
  background-color: #229954;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}
</style>