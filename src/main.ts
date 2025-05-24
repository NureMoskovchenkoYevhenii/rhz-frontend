import { createApp } from 'vue'
import App from './App.vue' // Переконайся, що шлях до App.vue правильний
import router from './router' // Імпортуй створений роутер (з src/router/index.js або index.ts)
import { createPinia } from 'pinia' // Імпортуй Pinia

import './assets/main.css' // Якщо ти створив цей файл

const app = createApp(App)
const pinia = createPinia() // Створи екземпляр Pinia

app.use(pinia) // Підключи Pinia
app.use(router) // Підключи роутер до екземпляру додатку

app.mount('#app')