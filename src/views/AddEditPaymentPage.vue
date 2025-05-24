<template>
  <div class="add-edit-payment-page">
    <h2>{{ pageTitle }}</h2>

    <div v-if="pageLoading" class="loading-indicator">Завантаження даних...</div>
    <div v-if="pageError" class="error-message global-error">
      {{ pageError }}
      <button @click="reloadData" v-if="isEditMode">Спробувати завантажити платіж</button>
    </div>

    <form @submit.prevent="handleSubmitPayment" v-if="!pageLoading && !pageError || !isEditMode">
      <div class="form-group">
        <label for="paymentName">Назва Платежу:*</label>
        <input type="text" id="paymentName" v-model.trim="paymentData.name" required />
      </div>

      <div class="form-group inline-group">
        <div>
            <label for="paymentAmount">Сума:</label>
            <input type="number" id="paymentAmount" v-model.number="paymentData.amount" step="0.01" :disabled="paymentData.isVariableAmount" />
        </div>
        <div class="checkbox-group">
            <input type="checkbox" id="isVariableAmount" v-model="paymentData.isVariableAmount" @change="handleVariableAmountChange" />
            <label for="isVariableAmount">Сума змінна</label>
        </div>
      </div>
       <div v-if="paymentData.isVariableAmount && paymentData.amount != null" class="info-message">
            Поле "Сума" буде проігноровано, оскільки відмічено "Сума змінна".
       </div>


      <div class="form-group">
        <label for="paymentCurrency">Валюта:</label>
        <select id="paymentCurrency" v-model="paymentData.currency">
          <option value="UAH">UAH</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <!-- Додай інші валюти за потреби -->
        </select>
      </div>

      <div class="form-group">
        <label for="paymentFrequency">Періодичність:*</label>
        <select id="paymentFrequency" v-model="paymentData.frequency" required>
          <option value="Monthly">Щомісячно</option>
          <option value="Quarterly">Щоквартально</option>
          <option value="Annually">Щорічно</option>
          <option value="OneTime">Одноразово</option>
          <!-- Додай інші варіанти за потреби -->
        </select>
      </div>

      <div class="form-group">
        <label for="nextDueDate">Дата Наступного Платежу:*</label>
        <input type="date" id="nextDueDate" v-model="paymentData.nextDueDate" required />
      </div>

      <div class="form-group">
        <label for="paymentCategory">Категорія:*</label>
        <select id="paymentCategory" v-model.number="paymentData.categoryID" required :disabled="categoriesLoading">
          <option :value="undefined" disabled>Оберіть категорію...</option>
          <option v-if="categoriesLoading" :value="undefined" disabled>Завантаження категорій...</option>
          <option v-for="category in availableCategories" :key="category.categoryID" :value="category.categoryID">
            {{ category.name }}
          </option>
        </select>
        <div v-if="categoriesError" class="error-message-small">{{ categoriesError }}</div>
      </div>

      <div class="form-group">
        <label for="paymentNotes">Нотатки (опціонально):</label>
        <textarea id="paymentNotes" v-model.trim="paymentData.notes"></textarea>
      </div>
      
      <div v-if="submitError" class="error-message submit-error">
        {{ submitError }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting || categoriesLoading">
          {{ isSubmitting ? 'Збереження...' : (isEditMode ? 'Оновити Платіж' : 'Додати Платіж') }}
        </button>
        <router-link to="/payments" class="cancel-button">Відміна</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
    getPaymentCategories, 
    createPayment,
    getPaymentById,
    updatePayment 
} from '../services/apiService';
import type { PaymentCategoryDto } from '../dtos/PaymentCategoryDtos';
import type { RecurringPaymentForCreationDto, RecurringPaymentForUpdateDto } from '../dtos/RecurringPaymentDtos';
import { useUserStore } from '../stores/userStore';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// Дані форми
const paymentData = ref<Partial<RecurringPaymentForCreationDto & RecurringPaymentForUpdateDto & { paymentID?: number, categoryID?: number}>>({
  name: '',
  amount: null, // Початково null, щоб користувач міг ввести або залишити порожнім для змінної суми
  currency: 'UAH',
  frequency: 'Monthly',
  nextDueDate: new Date().toISOString().split('T')[0], // Сьогоднішня дата за замовчуванням
  categoryID: undefined, // Не обрано
  notes: '',
  isVariableAmount: false
});

// Стан завантаження категорій
const availableCategories = ref<PaymentCategoryDto[]>([]);
const categoriesLoading = ref<boolean>(true);
const categoriesError = ref<string | null>(null);

// Загальний стан сторінки та форми
const pageLoading = ref<boolean>(false); // Для завантаження існуючого платежу в режимі редагування
const pageError = ref<string | null>(null);   // Для помилок завантаження існуючого платежу
const isSubmitting = ref<boolean>(false); // Для процесу відправки форми
const submitError = ref<string | null>(null); // Для помилок під час відправки форми

const paymentIdFromRoute = computed(() => route.params.id ? parseInt(route.params.id as string) : null);
const isEditMode = computed(() => paymentIdFromRoute.value !== null);
const pageTitle = computed(() => isEditMode.value ? 'Редагувати Платіж' : 'Додати Новий Платіж');

const loadAvailableCategories = async () => {
  categoriesLoading.value = true;
  categoriesError.value = null;
  try {
    availableCategories.value = await getPaymentCategories();
    if (availableCategories.value.length > 0 && !paymentData.value.categoryID && !isEditMode.value) {
        // Можна встановити першу категорію за замовчуванням для нових платежів, якщо потрібно
        // paymentData.value.categoryID = availableCategories.value[0].categoryID;
    }
  } catch (err) {
    console.error("Failed to load categories for dropdown:", err);
    categoriesError.value = "Не вдалося завантажити список категорій.";
  } finally {
    categoriesLoading.value = false;
  }
};

const loadPaymentForEdit = async (id: number) => {
  pageLoading.value = true;
  pageError.value = null;
  try {
    const payment = await getPaymentById(id);
    if (payment) {
      // Перевірка, чи належить платіж поточному користувачеві
      if (userStore.currentUser?.userID !== payment.userID) {
          pageError.value = "Ви не маєте права редагувати цей платіж.";
          // router.push('/payments'); // Або на сторінку "Доступ заборонено"
          return;
      }
      paymentData.value = {
        paymentID: payment.paymentID,
        name: payment.name,
        amount: payment.isVariableAmount ? null : payment.amount, // Якщо змінна, поле суми пусте
        currency: payment.currency,
        frequency: payment.frequency,
        nextDueDate: payment.nextDueDate.split('T')[0], // Формат YYYY-MM-DD для <input type="date">
        categoryID: payment.categoryID,
        notes: payment.notes,
        isVariableAmount: payment.isVariableAmount
      };
    } else {
      pageError.value = "Платіж не знайдено.";
    }
  } catch (err: any) {
    console.error(`Failed to load payment ${id} for edit:`, err);
    pageError.value = err.response?.data?.message || err.message || "Помилка завантаження даних платежу.";
  } finally {
    pageLoading.value = false;
  }
};

// Перезавантаження даних (якщо користувач намагається перейти на редагування з тим самим ID, але іншого платежу)
watch(() => route.params.id, (newId, oldId) => {
    if (isEditMode.value && newId && newId !== oldId) {
        loadPaymentForEdit(parseInt(newId as string));
    } else if (!newId && isEditMode.value) { // Якщо перейшли з edit на add
        resetForm();
    }
});


const resetForm = () => {
    paymentData.value = {
        name: '',
        amount: null,
        currency: 'UAH',
        frequency: 'Monthly',
        nextDueDate: new Date().toISOString().split('T')[0],
        categoryID: undefined,
        notes: '',
        isVariableAmount: false
    };
    pageError.value = null;
    submitError.value = null;
};

const handleVariableAmountChange = () => {
    if (paymentData.value.isVariableAmount) {
        paymentData.value.amount = null; // Очищаємо суму, якщо вона змінна
    }
};

onMounted(async () => {
  if (!userStore.isAuthenticated || !userStore.currentUser?.userID) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  await loadAvailableCategories();
  if (isEditMode.value && paymentIdFromRoute.value) {
    await loadPaymentForEdit(paymentIdFromRoute.value);
  } else {
      resetForm(); // Для режиму додавання
  }
});

const handleSubmitPayment = async () => {
  if (!userStore.currentUser?.userID) {
      submitError.value = "Користувач не автентифікований. Неможливо зберегти платіж.";
      return;
  }
  if (!paymentData.value.categoryID) {
      submitError.value = "Будь ласка, оберіть категорію.";
      return;
  }
   if (!paymentData.value.isVariableAmount && (paymentData.value.amount == null || paymentData.value.amount <= 0)) {
      submitError.value = "Сума має бути вказана і бути більшою за нуль, якщо це не платіж зі змінною сумою.";
      return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  // Готуємо дані DTO
  const commonData = {
    name: paymentData.value.name!,
    amount: paymentData.value.isVariableAmount ? null : paymentData.value.amount, // Надсилаємо null, якщо змінна
    currency: paymentData.value.currency!,
    frequency: paymentData.value.frequency!,
    nextDueDate: paymentData.value.nextDueDate!,
    categoryID: paymentData.value.categoryID!,
    notes: paymentData.value.notes,
    isVariableAmount: paymentData.value.isVariableAmount || false
  };

  try {
    if (isEditMode.value && paymentData.value.paymentID) {
      const updateDto: RecurringPaymentForUpdateDto = { ...commonData };
      await updatePayment(paymentData.value.paymentID, updateDto);
    } else {
      const creationDto: RecurringPaymentForCreationDto = { ...commonData };
      await createPayment(userStore.currentUser.userID, creationDto);
    }
    router.push('/payments'); // Перенаправлення на список платежів після успіху
  } catch (err: any) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} payment:`, err);
    submitError.value = err.response?.data?.message || err.response?.data?.title || err.message || 'Помилка збереження платежу.';
     if (err.response?.data?.errors) { // Обробка помилок валідації з ASP.NET Core
        let validationErrors = [];
        for (const key in err.response.data.errors) {
            if (err.response.data.errors[key] && err.response.data.errors[key].length > 0) {
                validationErrors.push(err.response.data.errors[key].join(' '));
            }
        }
        submitError.value = validationErrors.join('; ') || 'Помилка валідації на сервері.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const reloadData = () => {
    if (isEditMode.value && paymentIdFromRoute.value) {
        loadPaymentForEdit(paymentIdFromRoute.value);
    }
};

</script>

<style scoped>
.add-edit-payment-page {
  max-width: 600px;
  margin: 20px auto;
  padding: 25px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.add-edit-payment-page h2 {
    text-align: center;
    margin-bottom: 25px;
    color: #333;
}

.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}
.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 0.2rem rgba(52,152,219,.25);
    outline: none;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.inline-group {
    display: flex;
    align-items: flex-end; /* Або center, якщо мітки над полями */
    gap: 15px;
}
.inline-group > div {
    flex: 1;
}
.checkbox-group {
    display: flex;
    align-items: center;
    padding-bottom: 10px; /* Щоб вирівняти з інпутом, якщо мітка над ним */
}
.checkbox-group input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
}
.checkbox-group label {
    margin-bottom: 0; /* Прибираємо нижній відступ для мітки чекбоксу */
    font-weight: normal;
}
.info-message {
    font-size: 0.85em;
    color: #555;
    margin-top: -10px;
    margin-bottom: 10px;
}


.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.form-actions button, .form-actions .cancel-button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}
.form-actions button[type="submit"] {
  background-color: #27ae60;
  color: white;
}
.form-actions button[type="submit"]:disabled {
  background-color: #a3e4b7;
  cursor: not-allowed;
}
.cancel-button {
  background-color: #e0e0e0;
  color: #333;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
}
.cancel-button:hover {
    background-color: #d1d1d1;
}

.loading-indicator {
  text-align: center; padding: 20px; font-size: 1.1em;
}
.error-message, .submit-error, .global-error {
  color: red;
  background-color: #ffebee;
  border: 1px solid #e57373;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  text-align: center;
}
.error-message-small {
    font-size: 0.9em;
    color: red;
    margin-top: 4px;
}
.submit-error {
    margin-top: 15px;
}
</style>