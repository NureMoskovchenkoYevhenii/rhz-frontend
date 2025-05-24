<template>
  <div class="payments-list-page">
    <header class="page-header">
      <h2>Мої Регулярні Платежі</h2>
      <router-link to="/payments/add" class="add-button">+ Додати Новий Платіж</router-link>
    </header>

    <div v-if="loading" class="loading-indicator">Завантаження платежів...</div>
    <div v-if="error" class="error-message">
      Помилка: {{ error }}
      <button @click="loadUserPayments">Спробувати ще раз</button>
    </div>

    <div v-if="!loading && !error && payments.length > 0" class="payments-table-container">
      <table class="payments-table">
        <thead>
          <tr>
            <th>Назва</th>
            <th>Категорія</th>
            <th>Сума</th>
            <th>Валюта</th>
            <th>Періодичність</th>
            <th>Наступна дата</th>
            <th>Нотатки</th>
            <th>Змінна сума?</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.paymentID">
            <td>{{ payment.name }}</td>
            <td>{{ payment.categoryName || 'N/A' }}</td>
            <td>{{ payment.isVariableAmount ? 'Змінна' : formatCurrency(payment.amount) }}</td>
            <td>{{ payment.currency }}</td>
            <td>{{ payment.frequency }}</td>
            <td>{{ formatDate(payment.nextDueDate) }}</td>
            <td class="notes-cell" :title="payment.notes || ''">{{ truncateNotes(payment.notes) }}</td>
            <td>{{ payment.isVariableAmount ? 'Так' : 'Ні' }}</td>
            <td>
              <router-link :to="`/payments/edit/${payment.paymentID}`" class="action-button edit-button">
                Редагувати
              </router-link>
              <button @click="confirmDeletePayment(payment)" class="action-button delete-button">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && !error && payments.length === 0" class="no-payments-message">
      У вас ще немає запланованих платежів. 
      <router-link to="/payments/add">Додайте свій перший платіж!</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserPayments, deletePayment } from '../services/apiService'; // Переконайся, що deletePayment є
import type { RecurringPaymentDto } from '../dtos/RecurringPaymentDtos';
import { useUserStore } from '../stores/userStore';

const payments = ref<RecurringPaymentDto[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const userStore = useUserStore();
const router = useRouter();

const currentUserID = computed(() => userStore.currentUser?.userID);

const loadUserPayments = async () => {
  if (!currentUserID.value) {
    error.value = "Користувач не автентифікований.";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    payments.value = await getUserPayments(currentUserID.value);
  } catch (err: any) {
    console.error("Failed to load user payments:", err);
    if (err.response && err.response.status === 401) {
        error.value = 'Сесія застаріла або ви не авторизовані. Будь ласка, увійдіть знову.';
        userStore.logout(); 
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath }});
    } else {
        error.value = err.response?.data?.message || err.message || 'Не вдалося завантажити платежі.';
    }
    payments.value = []; // Очищаємо, якщо помилка
  } finally {
    loading.value = false;
  }
};

const confirmDeletePayment = async (payment: RecurringPaymentDto) => {
  if (window.confirm(`Ви впевнені, що хочете видалити платіж "${payment.name}"?`)) {
    loading.value = true; // Можна додати окремий isDeleting ref
    error.value = null;
    try {
      await deletePayment(payment.paymentID); // Ця функція має бути в apiService
      // Оновити список платежів після видалення
      payments.value = payments.value.filter(p => p.paymentID !== payment.paymentID);
      // Або викликати loadUserPayments() для повного оновлення, якщо є пагінація або складніші фільтри
      // await loadUserPayments(); 
    } catch (err: any) {
      console.error(`Failed to delete payment ${payment.paymentID}:`, err);
      error.value = err.response?.data?.message || err.message || 'Не вдалося видалити платіж.';
    } finally {
      loading.value = false;
    }
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(value); // TODO: currency from payment
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }); // Коротший формат
};

const truncateNotes = (notes: string | null | undefined, maxLength: number = 30): string => {
    if (!notes) return 'N/A';
    if (notes.length <= maxLength) return notes;
    return notes.substring(0, maxLength) + '...';
};

onMounted(() => {
  if (userStore.isAuthenticated && currentUserID.value) {
    loadUserPayments();
  } else {
    // Навігаційний гард має перенаправити на логін
    loading.value = false;
    // error.value = "Будь ласка, увійдіть для перегляду ваших платежів.";
  }
});
</script>

<style scoped>
.payments-list-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.page-header h2 {
  margin: 0;
}
.add-button {
  background-color: #27ae60; /* Зелений */
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  text-decoration: none;
  font-weight: 500;
}
.add-button:hover {
  background-color: #229954;
}

.payments-table-container {
    overflow-x: auto; /* Для горизонтального скролу на малих екранах */
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 0.9em;
}
.payments-table th, .payments-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  vertical-align: middle;
}
.payments-table th {
  background-color: #f4f6f8;
  font-weight: 600;
}
.notes-cell {
    max-width: 200px; /* Обмеження ширини для нотаток */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.action-button {
  padding: 6px 10px;
  margin-right: 5px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  font-size: 0.9em;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 3px; /* Для кнопок в стовпчик */
}
.edit-button {
  background-color: #3498db; /* Синій */
  color: white;
}
.edit-button:hover {
  background-color: #2980b9;
}
.delete-button {
  background-color: #e74c3c; /* Червоний */
  color: white;
}
.delete-button:hover {
  background-color: #c0392b;
}

.loading-indicator, .error-message, .no-payments-message {
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
  cursor: pointer;
}
.no-payments-message a {
    color: #3498db;
    text-decoration: underline;
}
</style>