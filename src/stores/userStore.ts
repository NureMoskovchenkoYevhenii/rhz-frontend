import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserDto } from '../dtos/UserDtos'; // Припускаємо, що UserDto має userID, email, fullName

interface AuthUser extends UserDto { // Розширюємо UserDto, якщо потрібно токен
    token?: string;
}

export const useUserStore = defineStore('user', () => {
    // Стан
    const currentUser = ref<AuthUser | null>(null);

    // Ініціалізація зі localStorage
    const storedUserInfoString = localStorage.getItem('user-info');
    const storedUserToken = localStorage.getItem('user-token');

    console.log('USER STORE - Initial storedUserToken from localStorage:', storedUserToken); // ДЛЯ ДЕБАГУ
    console.log('USER STORE - Initial storedUserInfoString from localStorage:', storedUserInfoString); // ДЛЯ ДЕБАГУ

    if (storedUserInfoString && storedUserToken) { // <--- Ключова перевірка: ТУТ ТРЕБА МАТИ ОБИДВА
        try {
            const userInfo = JSON.parse(storedUserInfoString);
            currentUser.value = { 
                userID: userInfo.userID,
                email: userInfo.email,
                fullName: userInfo.fullName,
                token: storedUserToken // <--- Встановлюємо токен
            };
            console.log('USER STORE - User loaded from localStorage:', JSON.stringify(currentUser.value)); // ДЛЯ ДЕБАГУ
        } catch (e) {
            console.error("USER STORE - Failed to parse user-info from localStorage", e);
            localStorage.removeItem('user-info');
            localStorage.removeItem('user-token');
        }
    } else {
        console.log('USER STORE - No complete user session found in localStorage.'); // ДЛЯ ДЕБАГУ
    }

    const isAuthenticated = computed(() => !!currentUser.value && !!currentUser.value.token); // ЦЕ ЗАЛЕЖИТЬ ВІД ТОКЕНА В currentUser

    // Дії (Actions)
    function setUser(userData: AuthUser | null) {
    console.log('USER STORE - setUser called with:', JSON.stringify(userData)); // ДЛЯ ДЕБАГУ
    currentUser.value = userData;
    if (userData && userData.token) {
        localStorage.setItem('user-token', userData.token);
        // Зберігаємо user-info без токена, щоб не дублювати і для безпеки
        localStorage.setItem('user-info', JSON.stringify({
            userID: userData.userID,
            email: userData.email,
            fullName: userData.fullName
        }));
        console.log('USER STORE - Token and info saved to localStorage.'); // ДЛЯ ДЕБАГУ
    } else {
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-info');
        console.log('USER STORE - Token and info removed from localStorage.'); // ДЛЯ ДЕБАГУ
    }
    console.log('USER STORE - currentUser after setUser:', JSON.stringify(currentUser.value)); // ДЛЯ ДЕБАГУ
    console.log('USER STORE - isAuthenticated after setUser:', isAuthenticated.value); // ДЛЯ ДЕБАГУ
}

    function logout() {
        setUser(null);
        // Тут можна додати перенаправлення на сторінку логіну
        // router.push('/login'); // Потрібно імпортувати router, якщо використовується тут
    }
    
    // Геттери (Getters) - вже визначені як computed вище

    return { currentUser, isAuthenticated, setUser, logout };
});