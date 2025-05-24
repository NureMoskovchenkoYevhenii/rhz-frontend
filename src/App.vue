<template>
  <div id="app-layout">
    <header class="app-header">
      <h1>Менеджер Регулярних Платежів</h1>
      <nav class="user-nav">
        <!-- УМОВНЕ ВІДОБРАЖЕННЯ -->
        <template v-if="userStore.isAuthenticated && userStore.currentUser">
          <span>Вітаємо, {{ userStore.currentUser.fullName || userStore.currentUser.email }}!</span>
          <a href="#" @click.prevent="handleLogout" style="margin-left: 15px; cursor: pointer; color: white; text-decoration: none;">Вихід</a>
        </template>
        <template v-else>
          <span>Вітаємо, Гість!</span>
          <router-link to="/login">Вхід</router-link> | 
          <router-link to="/register">Реєстрація</router-link>
        </template>
      </nav>
    </header>

    <div class="main-container">
      <aside class="sidebar-nav">
        <nav>
          <ul>
            <li><router-link to="/dashboard">Дашборд</router-link></li>
            <li><router-link to="/payments">Мої Платежі</router-link></li>
            <li><router-link to="/payments/add">Додати Платіж</router-link></li>
            <li><router-link to="/categories">Категорії</router-link></li>
          </ul>
        </nav>
      </aside>

      <main class="content-area">
        <router-view />
      </main>
    </div>

    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} Менеджер Регулярних Платежів. Всі права захищено.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/userStore'; // Переконайся, що шлях правильний

const router = useRouter();
const userStore = useUserStore(); // userStore тепер доступний у шаблоні

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
/* Базові стилі для макету (можна винести в окремий CSS файл) */
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-header {
  background-color: #34495e;
  color: white;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em;
}

.user-nav a {
  color: white;
  margin-left: 15px;
  text-decoration: none;
}
.user-nav a:hover {
  text-decoration: underline;
}


.main-container {
  display: flex;
  flex-grow: 1; /* Щоб контент займав весь доступний простір */
}

.sidebar-nav {
  width: 220px;
  background-color: #f4f6f8;
  padding: 20px;
  border-right: 1px solid #e0e0e0;
}

.sidebar-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li a {
  display: block;
  padding: 10px 15px;
  text-decoration: none;
  color: #333;
  border-radius: 4px;
  margin-bottom: 5px;
}

.sidebar-nav li a:hover,
.sidebar-nav li a.router-link-exact-active { /* Стиль для активного посилання */
  background-color: #e0e0e0;
  color: #2c3e50;
}

.content-area {
  flex-grow: 1;
  padding: 20px;
  background-color: #ffffff;
}

.app-footer {
  text-align: center;
  padding: 15px;
  background-color: #ecf0f1;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9em;
  color: #7f8c8d;
}
.user-nav span {
  margin-right: 10px; /* Додай відступ для імені користувача */
}
</style>