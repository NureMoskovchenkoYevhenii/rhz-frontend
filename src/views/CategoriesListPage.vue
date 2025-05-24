<template>
  <div class="categories-list-page">
    <header class="page-header">
      <h2>Доступні Категорії Платежів</h2>
      <!-- Тут НЕМАЄ кнопки "+ Додати Категорію" -->
    </header>

    <div v-if="loading" class="loading-indicator">Завантаження категорій...</div>
    <div v-if="error" class="error-message">
      Помилка: {{ error }}
      <button @click="loadCategories">Спробувати ще раз</button>
    </div>

    <table v-if="!loading && !error && categories.length > 0" class="categories-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Назва</th>
          <th>Опис</th>
          <!-- Тут НЕМАЄ стовпця "Дії" -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="category in categories" :key="category.categoryID">
          <td>{{ category.categoryID }}</td>
          <td>{{ category.name }}</td>
          <td>{{ category.description || 'N/A' }}</td>
          <!-- Тут НЕМАЄ кнопок "Редагувати" та "Видалити" -->
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && !error && categories.length === 0">Наразі немає доступних категорій.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
    getPaymentCategories, 
    //createPaymentCategory, 
    //updatePaymentCategory, 
   // deletePaymentCategory 
} from '../services/apiService';
import type { PaymentCategoryDto, /*PaymentCategoryForCreationDto, PaymentCategoryForUpdateDto */} from '../dtos/PaymentCategoryDtos';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';

const categories = ref<PaymentCategoryDto[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
//const isSubmitting = ref<boolean>(false); // Для стану кнопки в модальному вікні
//const modalError = ref<string | null>(null); // Помилки в модальному вікні

//const showModal = ref<boolean>(false);
//const modalMode = ref<'create' | 'edit'>('create');
//const currentCategory = ref<Partial<PaymentCategoryDto & PaymentCategoryForCreationDto & PaymentCategoryForUpdateDto>>({}); // Для форми

const userStore = useUserStore();
const router = useRouter();

const loadCategories = async () => {
  if (!userStore.isAuthenticated) {
    error.value = "Будь ласка, увійдіть для перегляду категорій.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    categories.value = await getPaymentCategories();
  } catch (err: any) {
    console.error("Failed to load categories:", err);
    error.value = err.response?.data?.message || err.message || 'Не вдалося завантажити категорії.';
  } finally {
    loading.value = false;
  }
};

/*const openCreateModal = () => {
  modalMode.value = 'create';
  currentCategory.value = { name: '', description: '' }; // Скидаємо форму
  modalError.value = null;
  showModal.value = true;
};

const openEditModal = (category: PaymentCategoryDto) => {
  modalMode.value = 'edit';
  currentCategory.value = { ...category }; // Копіюємо дані для редагування
  modalError.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentCategory.value = {};
  modalError.value = null;
};

const handleSubmitCategory = async () => {
  if (!currentCategory.value.name?.trim()) {
    modalError.value = "Назва категорії не може бути порожньою.";
    return;
  }
  
  isSubmitting.value = true;
  modalError.value = null;

  try {
    if (modalMode.value === 'create') {
      const creationData: PaymentCategoryForCreationDto = {
        name: currentCategory.value.name,
        description: currentCategory.value.description || undefined
      };
      await createPaymentCategory(creationData);
    } else if (modalMode.value === 'edit' && currentCategory.value.categoryID) {
      const updateData: PaymentCategoryForUpdateDto = {
        name: currentCategory.value.name,
        description: currentCategory.value.description || undefined
      };
      await updatePaymentCategory(currentCategory.value.categoryID, updateData);
    }
    await loadCategories(); // Оновити список після успішної операції
    closeModal();
  } catch (err: any) {
    console.error(`Failed to ${modalMode.value} category:`, err);
    modalError.value = err.response?.data?.message || err.response?.data?.title || err.message || `Не вдалося ${modalMode.value === 'create' ? 'створити' : 'оновити'} категорію.`;
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = async (category: PaymentCategoryDto) => {
  if (window.confirm(`Ви впевнені, що хочете видалити категорію "${category.name}"? Це може вплинути на існуючі платежі.`)) {
    loading.value = true; // Показати індикатор завантаження для операції видалення
    error.value = null;
    try {
      await deletePaymentCategory(category.categoryID);
      await loadCategories(); // Оновити список
    } catch (err: any) {
      console.error(`Failed to delete category ${category.categoryID}:`, err);
      error.value = err.response?.data?.message || err.response?.data?.title || err.message || 'Не вдалося видалити категорію.';
       // Якщо помилка Conflict (409), можна вивести більш специфічне повідомлення
      if (err.response?.status === 409) {
        error.value = `Неможливо видалити категорію "${category.name}", оскільки вона використовується в платежах.`;
      }
    } finally {
      loading.value = false;
    }
  }
};
*/
onMounted(() => {
  if (!userStore.isAuthenticated) {
    // Перенаправлення на логін, якщо не автентифікований
    // Це має оброблятися навігаційним гардом, але тут додаткова перевірка
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
  } else {
    loadCategories();
  }
});
</script>

<style scoped>
.categories-list-page {
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
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
.add-button:hover {
  background-color: #229954;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.categories-table th, .categories-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}
.categories-table th {
  background-color: #f9f9f9;
}
.action-button {
  padding: 5px 10px;
  margin-right: 5px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid transparent;
}
.edit-button {
  background-color: #3498db;
  color: white;
}
.edit-button:hover {
  background-color: #2980b9;
}
.delete-button {
  background-color: #e74c3c;
  color: white;
}
.delete-button:hover {
  background-color: #c0392b;
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

/* Стилі для модального вікна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 500px;
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-group textarea {
  min-height: 80px;
  resize: vertical;
}
.modal-actions {
  margin-top: 20px;
  text-align: right;
}
.modal-actions button {
  padding: 10px 15px;
  margin-left: 10px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}
.modal-actions button[type="submit"] {
  background-color: #27ae60;
  color: white;
}
.modal-actions button[type="submit"]:hover {
  background-color: #229954;
}
.modal-actions button[type="submit"]:disabled {
  background-color: #a3e4b7;
  cursor: not-allowed;
}
.cancel-button {
  background-color: #e0e0e0;
  color: #333;
}
.cancel-button:hover {
  background-color: #bdbdbd;
}
.modal-error {
  margin-bottom: 10px; /* Трохи місця перед кнопками */
}
</style>