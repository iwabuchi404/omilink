import { createApp } from 'vue'
import './assets/css/style.css'
import App from './App.vue'
import i18n from './lib/i18n'
import router from './router'

const app = createApp(App)
app.use(i18n)
app.use(router)
app.mount('#app')
