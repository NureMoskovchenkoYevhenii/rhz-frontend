// src/dtos/RecurringPaymentDtos.ts
//import type { UserDto } from './UserDtos'; // Для включення інформації про користувача
//import type { PaymentCategoryDto } from './PaymentCategoryDtos'; // Для включення інформації про категорію

// DTO для відображення інформації про регулярний платіж
export interface RecurringPaymentDto {
  paymentID: number;
  userID: number; // Або UserDto, якщо хочеш повну інформацію про користувача
  userName?: string; // Для зручності на фронтенді
  categoryID: number; // Або PaymentCategoryDto
  categoryName?: string; // Для зручності на фронтенді
  name: string;
  amount?: number | null;
  currency: string;
  frequency: string;
  nextDueDate: string; // Дата у форматі ISO рядка (YYYY-MM-DD)
  notes?: string | null;
  isVariableAmount: boolean;
  // Можна додати isActive, createdAt, updatedAt, якщо вони є в сутності і потрібні клієнту
}

// DTO для створення нового регулярного платежу
export interface RecurringPaymentForCreationDto {
  categoryID: number;
  name: string;
  amount?: number | null;
  currency?: string; // Може бути необов'язковим, якщо є дефолтне значення на бекенді
  frequency: string;
  nextDueDate: string; // Дата у форматі ISO рядка (YYYY-MM-DD)
  notes?: string | null;
  isVariableAmount?: boolean; // Може бути необов'язковим, якщо є дефолтне
  // UserID буде визначатися на бекенді (з автентифікованого користувача) або передаватися в URL
}

// DTO для оновлення існуючого регулярного платежу
export interface RecurringPaymentForUpdateDto {
  // PaymentID зазвичай передається в URL, а не в тілі
  categoryID: number;
  name: string;
  amount?: number | null;
  currency?: string;
  frequency: string;
  nextDueDate: string; // Дата у форматі ISO рядка (YYYY-MM-DD)
  notes?: string | null;
  isVariableAmount?: boolean;
  // UserID зазвичай не змінюється для існуючого платежу
}