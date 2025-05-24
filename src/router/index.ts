

// Імпортуй компоненти сторінок
import DashboardPage from '../views/DashboardPage.vue';
import PaymentsListPage from '../views/PaymentsListPage.vue';
import AddEditPaymentPage from '../views/AddEditPaymentPage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import NotFoundPage from '../views/NotFoundPage.vue';
import CategoriesListPage from '../views/CategoriesListPage.vue'; // <--- ДОДАЙ ЦЕЙ ІМПОРТ
import { useUserStore } from '../stores/userStore'; // Імпортуємо user store
import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext } from 'vue-router'; 

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true } // Цей маршрут вимагає автентифікації
  },
  {
    path: '/payments',
    name: 'PaymentsList',
    component: PaymentsListPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/payments/add',
    name: 'AddPayment',
    component: AddEditPaymentPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/payments/edit/:id',
    name: 'EditPayment',
    component: AddEditPaymentPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'CategoriesList',
    component: CategoriesListPage,
    meta: { requiresAuth: true } // Також захистимо, якщо потрібно
  },
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  linkActiveClass: 'router-link-active',
  linkExactActiveClass: 'router-link-exact-active'
});

router.beforeEach((to, from, next: NavigationGuardNext) => { // <--- ЯВНО ВКАЗУЄМО ТИП ДЛЯ next
  const userStore = useUserStore(); 

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  console.log('GUARD: Navigating to:', to.name, from, 'Requires Auth:', requiresAuth, 'Is Authenticated:', userStore.isAuthenticated);

  if (requiresAuth && !userStore.isAuthenticated) {
    console.log('Redirecting to Login because requiresAuth and not authenticated');
    next({ name: 'Login', query: { redirect: to.fullPath } }); // Тепер TypeScript має зрозуміти
  } else if ((to.name === 'Login' || to.name === 'Register') && userStore.isAuthenticated) {
    console.log('Redirecting to Dashboard because on Login/Register and authenticated');
    next({ name: 'Dashboard' }); // І тут також
  } else {
    console.log('Proceeding to route');
    next(); // Виклик без аргументів
  }
});

export default router;