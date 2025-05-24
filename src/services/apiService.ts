// src/services/apiService.ts
import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import type { PaymentCategoryDto } from '../dtos/PaymentCategoryDtos'; // Припустимо, ти створив DTO
import type { UserLoginDto, LoginResponseDto, UserForCreationDto, UserDto } from '../dtos/UserDtos'; // Або AuthDtos
import type { RecurringPaymentDto } from '../dtos/RecurringPaymentDtos'
import { useUserStore } from '../stores/userStore';
import type { PaymentCategoryForCreationDto, PaymentCategoryForUpdateDto } from '../dtos/PaymentCategoryDtos';
// Додай імпорти для DTO платежів
import type { 
    RecurringPaymentForCreationDto, 
    RecurringPaymentForUpdateDto 
} from '../dtos/RecurringPaymentDtos';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json' // Можна додати, якщо API завжди повертає JSON
  },
});

// Перехоплювач для логування або обробки помилок (опціонально)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Тут можна обробити помилки глобально
    console.error('API call error:', error.response?.data || error.message);
    // Можна кидати кастомну помилку або повертати щось специфічне
    return Promise.reject(error);
  }
);

// Функції для виклику API ендпоінтів

// --- Payment Categories ---
export const getPaymentCategories = async (): Promise<PaymentCategoryDto[]> => {
  try {
    const response = await apiClient.get<PaymentCategoryDto[]>('api/categories'); // Шлях до ендпоінту
    return response.data;
  } catch (error) {
    // Обробка помилки може бути тут або в перехоплювачі
    console.error('Error fetching payment categories:', error);
    throw error; // Перекидаємо помилку, щоб компонент міг її обробити
  }
};

export const getPaymentCategoryById = async (id: number): Promise<PaymentCategoryDto | null> => {
    try {
        const response = await apiClient.get<PaymentCategoryDto>(`api/categories/${id}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return null; // Категорія не знайдена
        }
        console.error(`Error fetching payment category with id ${id}:`, error);
        throw error;
    }
};

// --- Authentication ---
export const loginUser = async (loginData: UserLoginDto): Promise<LoginResponseDto> => {
  try {
    // Припустимо, твій ендпоінт /api/auth/login
    // Якщо інший, наприклад /api/users/login, зміни шлях
    const response = await apiClient.post<LoginResponseDto>('api/users/login', loginData);
    return response.data;
  } catch (error: any) {
    console.error('Error logging in user:', error.response?.data || error.message);
    throw error; // Перекидаємо помилку для обробки в компоненті
  }
};
// TODO: Додай сюди функції для POST, PUT, DELETE категорій
// export const createPaymentCategory = async (categoryData: PaymentCategoryForCreationDto): Promise<PaymentCategoryDto> => { ... }

export const registerUser = async (userData: UserForCreationDto): Promise<UserDto> => {
  try {
    const response = await apiClient.post<UserDto>('api/users/register', userData);
    return response.data;
  } catch (error: any) {
    console.error('Error registering user:', error.response?.data || error.message);
    throw error; // Перекидаємо помилку для обробки в компоненті
  }
};



export const createPaymentCategory = async (categoryData: PaymentCategoryForCreationDto): Promise<PaymentCategoryDto> => {
  try {
    const response = await apiClient.post<PaymentCategoryDto>('api/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment category:', error);
    throw error;
  }
};

export const updatePaymentCategory = async (id: number, categoryData: PaymentCategoryForUpdateDto): Promise<void> => {
  try {
    await apiClient.put(`api/categories/${id}`, categoryData);
  } catch (error) {
    console.error(`Error updating payment category ${id}:`, error);
    throw error;
  }
};

export const deletePaymentCategory = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`api/categories/${id}`);
  } catch (error) {
    console.error(`Error deleting payment category ${id}:`, error);
    throw error;
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const userStore = useUserStore(); // Отримуємо стор
    if (userStore.isAuthenticated && userStore.currentUser?.token) {
      config.headers.Authorization = `Bearer ${userStore.currentUser.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



// --- Recurring Payments ---
export const getUserPayments = async (userId: number): Promise<RecurringPaymentDto[]> => {
  try {
    const response = await apiClient.get<RecurringPaymentDto[]>(`api/users/${userId}/payments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payments for user ${userId}:`, error);
    throw error;
  }
};

export const getPaymentById = async (paymentId: number): Promise<RecurringPaymentDto | null> => {
    try {
        const response = await apiClient.get<RecurringPaymentDto>(`api/payments/${paymentId}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error(`Error fetching payment with id ${paymentId}:`, error);
        throw error;
    }
};

// Ось функція, якої не вистачало:
export const createPayment = async (userId: number, paymentData: RecurringPaymentForCreationDto): Promise<RecurringPaymentDto> => {
  try {
    // Запит на ендпоінт, який ти визначив на бекенді (наприклад, POST api/users/{userId}/payments)
    const response = await apiClient.post<RecurringPaymentDto>(`api/users/${userId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePayment = async (paymentId: number, paymentData: RecurringPaymentForUpdateDto): Promise<void> => {
  try {
    // Запит на ендпоінт, який ти визначив на бекенді (наприклад, PUT api/payments/{paymentId})
    await apiClient.put(`api/payments/${paymentId}`, paymentData);
  } catch (error) {
    console.error(`Error updating payment ${paymentId}:`, error);
    throw error;
  }
};

export const deletePayment = async (paymentId: number): Promise<void> => {
  try {
    // Запит на ендпоінт, який ти визначив на бекенді (наприклад, DELETE api/payments/{paymentId})
    await apiClient.delete(`api/payments/${paymentId}`);
  } catch (error) {
    console.error(`Error deleting payment ${paymentId}:`, error);
    throw error; // Перекидаємо помилку для обробки в компоненті
  }
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const userStore = useUserStore();
    const originalRequest = error.config;

    // Якщо помилка 401 (Unauthorized) і це не повторний запит
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true; // Позначаємо, що це повторний запит
      
      // TODO: Тут можна спробувати оновити токен (refresh token), якщо така логіка є
      // Якщо оновлення токена успішне:
      // axios.defaults.headers.common['Authorization'] = 'Bearer ' + new_token;
      // userStore.setToken(new_token); // Оновити токен в сторі
      // return apiClient(originalRequest); // Повторити оригінальний запит

      // Якщо немає логіки оновлення токена, або вона не вдалася:
      console.error('Unauthorized or token expired. Logging out.');
      userStore.logout(); // Вийти з системи
      // router.push('/login'); // Потрібно буде імпортувати router сюди, або обробляти перенаправлення в компоненті
      // Наразі просто кидаємо помилку далі або повертаємо відхилений проміс
      return Promise.reject(error); 
    }
    
    console.error('API call error (interceptor):', error.response?.data || error.message);
    return Promise.reject(error);
  }
);



export default apiClient; // Експортуємо екземпляр apiClient, якщо потрібно використовувати його напряму