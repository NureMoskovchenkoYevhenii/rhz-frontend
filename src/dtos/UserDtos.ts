// src/dtos/UserDtos.ts

// DTO для відображення інформації про користувача (клієнту)
// НЕ містить PasswordHash
export interface UserDto {
  userID: number;
  email: string;
  fullName?: string | null; // Зробимо fullName необов'язковим, як у моделі
  // Можна додати інші поля, які безпечно показувати, наприклад, дата реєстрації
  // createdAt?: string; // Якщо будеш додавати CreatedAt до User моделі
}

// DTO для створення нового користувача (надсилається від клієнта на сервер)
export interface UserForCreationDto {
  email: string;
  password: string; // Звичайний пароль, який буде хешуватися на бекенді
  fullName?: string | null;
}

// DTO для оновлення інформації про користувача (надсилається від клієнта)
export interface UserForUpdateDto {
  email: string; // Припускаємо, що email можна змінювати (потребує валідації унікальності на бекенді)
  fullName?: string | null;
  // Пароль зазвичай змінюється через окремий процес/ендпоінт
}

// DTO для процесу логіну
export interface UserLoginDto {
  email: string;
  password: string;
}

// DTO для зміни пароля
export interface UserChangePasswordDto {
    currentPassword?: string; // Для перевірки старого пароля, якщо потрібно
    newPassword: string;
}

// DTO для відповіді після успішного логіну
// У реальному додатку тут був би токен доступу (access_token)
export interface LoginResponseDto {
  userID: number;
  email: string;
  fullName?: string | null; // Може бути null або undefined, якщо не вказано
  token: string; // <--- ПЕРЕКОНАЙСЯ, ЩО ЦЕ ПОЛЕ ТУТ Є І НАЗВАНО САМЕ ТАК
}



export interface UserForCreationDto { // Для відправки на API
  email: string;
  password: string; // Звичайний пароль, буде хешуватися на бекенді
  fullName?: string | null;
}