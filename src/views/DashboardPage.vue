<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <h2>Дашборд</h2>
      <!-- Відображаємо ім'я, якщо користувач автентифікований -->
      <p v-if="userStore.isAuthenticated">Вітаємо, {{ currentUserName }}!</p>
      <p v-else>Для перегляду дашборду, будь ласка, <router-link to="/login">увійдіть</router-link>.</p>
    </header>

    <!-- Показуємо індикатор завантаження, якщо йде завантаження І користувач автентифікований -->
    <div v-if="loading && userStore.isAuthenticated" class="loading-indicator">Завантаження даних дашборду...</div>
    
    <!-- Показуємо повідомлення про помилку, якщо вона є -->
    <div v-if="error" class="error-message">
      Помилка завантаження даних: {{ error }}
      <button @click="fetchDashboardData" :disabled="loading || !currentUserID">Спробувати ще раз</button>
    </div>

    <!-- Основний контент дашборду, показуємо тільки якщо немає завантаження, помилки, І користувач автентифікований -->
    <template v-if="!loading && !error && userStore.isAuthenticated">
      <section class="summary-cards">
        <div class="card">
          <h3>Загалом цього місяця</h3>
          <p class="amount">{{ formatCurrency(totalThisMonth) }}</p>
        </div>
        <div class="card">
          <h3>Загалом наступного місяця</h3>
          <p class="amount">{{ formatCurrency(totalNextMonth) }}</p>
        </div>
        <div class="card quick-action">
           <router-link to="/payments/add" class="add-payment-button">
              + Додати Новий Платіж
          </router-link>
        </div>
      </section>

      <section v-if="upcomingPayments.length > 0" class="upcoming-payments">
        <h3>Найближчі Платежі (наступні {{ upcomingDaysFilter }} днів)</h3>
        <ul>
          <li v-for="payment in upcomingPayments" :key="payment.paymentID" class="payment-item">
            <div class="payment-info">
              <span class="payment-name">{{ payment.name }}</span>
              <span class="payment-category">{{ payment.categoryName }}</span>
            </div>
            <div class="payment-details">
              <span class="payment-amount">{{ formatCurrency(payment.amount) }}</span>
              <span class="payment-duedate">До: {{ formatDate(payment.nextDueDate) }}</span>
            </div>
          </li>
        </ul>
        <router-link to="/payments" class="view-all-link">Переглянути всі платежі</router-link>
      </section>
      
      <!-- Повідомлення, якщо немає платежів -->
      <p v-if="allPayments.length === 0">
        У вас ще немає запланованих платежів. 
        <router-link to="/payments/add">Додайте перший!</router-link>
      </p>
      <p v-else-if="upcomingPayments.length === 0">
        Немає платежів у найближчі {{ upcomingDaysFilter }} днів.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router'; // Імпортуємо useRouter
import { getUserPayments, /* можливо, getUserById для отримання імені, якщо воно не в userStore */ } from '../services/apiService';
import type { RecurringPaymentDto } from '../dtos/RecurringPaymentDtos';
import { useUserStore } from '../stores/userStore';

const allPayments = ref<RecurringPaymentDto[]>([]);
const loading = ref<boolean>(false); // Початково false, стане true при завантаженні
const error = ref<string | null>(null);
const upcomingDaysFilter = ref<number>(30);

const userStore = useUserStore();
const router = useRouter(); // Ініціалізуємо router

// Computed властивості для доступу до даних користувача зі стору
const currentUserID = computed(() => userStore.currentUser?.userID);
const currentUserName = computed(() => userStore.currentUser?.fullName || userStore.currentUser?.email); // Додаємо fallback на email

const fetchDashboardData = async () => {
  // Перевіряємо, чи є userID перед запитом
  if (!currentUserID.value) {
    error.value = "Не вдалося отримати ID користувача для завантаження даних.";
    // Якщо isAuthenticated false, навігаційний гард має перекинути на логін,
    // але тут можна додатково перевірити і не починати завантаження.
    if (!userStore.isAuthenticated) {
        error.value = "Будь ласка, увійдіть для перегляду дашборду.";
    }
    loading.value = false;
    return;
  }
  
  loading.value = true;
  error.value = null;
  try {
    allPayments.value = await getUserPayments(currentUserID.value);
    // Якщо ім'я користувача не завантажується при логіні, можна завантажити тут:
    // if (!userStore.currentUser?.fullName && userStore.currentUser?.email) {
    //    const userDetails = await getUserById(currentUserID.value); // Потрібно створити getUserById в apiService
    //    if (userDetails) {
    //        userStore.setUser({ ...userStore.currentUser, fullName: userDetails.fullName });
    //    }
    // }
  } catch (err: any) {
    console.error("Failed to load dashboard data:", err);
    allPayments.value = []; // Очищаємо платежі у разі помилки
    if (err.response && err.response.status === 401) {
        error.value = 'Сесія застаріла або ви не авторизовані. Будь ласка, увійдіть знову.';
        userStore.logout(); 
        setTimeout(() => router.push('/login'), 2000);
    } else {
        error.value = err.response?.data?.message || err.message || 'Не вдалося завантажити дані.';
    }
  } finally {
    loading.value = false;
  }
};

const calculateMonthlyTotal = (payments: RecurringPaymentDto[], targetMonth: number, targetYear: number): number => {
  return payments
    .filter(p => {
      if (!p.nextDueDate) return false; // Додай перевірку на наявність дати
      const dueDate = new Date(p.nextDueDate);
      return dueDate.getFullYear() === targetYear && dueDate.getMonth() === targetMonth;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
};

const totalThisMonth = computed(() => {
  if (!allPayments.value) return 0;
  const now = new Date();
  return calculateMonthlyTotal(allPayments.value, now.getMonth(), now.getFullYear());
});

const totalNextMonth = computed(() => {
  if (!allPayments.value) return 0;
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return calculateMonthlyTotal(allPayments.value, nextMonthDate.getMonth(), nextMonthDate.getFullYear());
});

const upcomingPayments = computed(() => {
  if (!allPayments.value) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() + upcomingDaysFilter.value);

  return allPayments.value
    .filter(p => {
      if (!p.nextDueDate) return false;
      const dueDate = new Date(p.nextDueDate);
      return dueDate >= today && dueDate < limitDate;
    })
    .sort((a, b) => {
        if (!a.nextDueDate || !b.nextDueDate) return 0;
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    });
});

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(value);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });
};

onMounted(() => {
  // Перевіряємо, чи користувач автентифікований, перш ніж завантажувати дані
  if (userStore.isAuthenticated && currentUserID.value) {
    fetchDashboardData();
  } else if (!userStore.isAuthenticated) {
    // Якщо користувач не автентифікований, але потрапив сюди (мало б не статися через гард)
    // можна перенаправити або показати повідомлення
    // error.value = "Будь ласка, увійдіть для перегляду дашборду.";
    // router.push('/login'); // Або краще обробити в навігаційному гарді
    loading.value = false; // Немає чого завантажувати
  }
});

// Спостерігаємо за зміною користувача (наприклад, після логіну/логуату)
watch(() => userStore.currentUser, (newUser) => {
    if (newUser && newUser.userID) { // Якщо новий користувач з'явився і має ID
        fetchDashboardData();
    } else if (!newUser) { // Якщо користувач вийшов
        allPayments.value = [];
        error.value = null; // Очистити попередні помилки/дані
        loading.value = false;
    }
}, { immediate: false, deep: true }); // immediate: false, щоб не викликати при першому рендері, бо onMounted вже є

</script>

<style scoped>
/* ... Твої стилі залишаються такими ж ... */
.dashboard-page {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.dashboard-header h2 {
  margin-top: 0;
}
.dashboard-header p {
  color: #555;
}


.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 200px; /* Для кращої адаптивності */
  text-align: center;
}

.card h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.1em;
}

.card .amount {
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50; /* Темно-синій */
  margin: 10px 0;
}

.card.quick-action {
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-payment-button {
    display: inline-block;
    background-color: #27ae60; /* Зелений */
    color: white;
    padding: 12px 25px;
    text-decoration: none;
    border-radius: 5px;
    font-size: 1.1em;
    font-weight: bold;
    transition: background-color 0.3s ease;
}
.add-payment-button:hover {
    background-color: #229954;
}


.upcoming-payments h3 {
  margin-bottom: 15px;
  color: #333;
}

.upcoming-payments ul {
  list-style-type: none;
  padding: 0;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.payment-item:last-child {
  border-bottom: none;
}

.payment-info .payment-name {
  font-weight: bold;
  display: block;
}
.payment-info .payment-category {
  font-size: 0.9em;
  color: #777;
}

.payment-details .payment-amount {
  font-weight: bold;
  margin-right: 15px;
}
.payment-details .payment-duedate {
  color: #555;
  font-size: 0.9em;
}

.view-all-link {
  display: inline-block;
  margin-top: 20px;
  color: #3498db;
  text-decoration: none;
}
.view-all-link:hover {
  text-decoration: underline;
}

.loading-indicator, .error-message {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
}
.error-message {
  color: red;
  border: 1px solid red;
  background-color: #ffebee;
  border-radius: 4px;
}
.error-message button {
  margin-left: 10px;
  padding: 5px 10px;
}
</style>