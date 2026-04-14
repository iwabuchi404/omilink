<script setup lang="ts">
import { ref, onMounted } from 'vue';
import pb from '../lib/pocketbase';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const { locale } = useI18n();

const currentLanguage = ref(locale.value === 'ja' ? 'JA' : 'EN');

const toggleLanguage = () => {
  const newLang = currentLanguage.value === 'EN' ? 'JA' : 'EN';
  currentLanguage.value = newLang;
  locale.value = newLang.toLowerCase();
  localStorage.setItem('app-language', locale.value);
};

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const name = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    if (isLogin.value) {
      await pb.collection('users').authWithPassword(email.value, password.value);
    } else {
      const data = {
        email: email.value,
        password: password.value,
        passwordConfirm: password.value,
        name: name.value,
      };
      await pb.collection('users').create(data);
      await pb.collection('users').authWithPassword(email.value, password.value);
    }
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    error.value = err.message || 'Authentication failed';
  } finally {
    loading.value = false;
  }
}

async function handleGoogleLogin() {
  error.value = '';
  loading.value = true;
  try {
    const authMethods = await pb.collection('users').listAuthMethods();
    const provider = authMethods.oauth2.providers.find((p: any) => p.name === 'google');
    
    if (!provider) {
      throw new Error("Google login is not configured.");
    }
    
    localStorage.setItem('provider', JSON.stringify(provider));
    
    const redirectUrl = window.location.origin + '/login';
    window.location.href = provider.authURL + redirectUrl;
    // We don't push to dashboard here because browser will redirect
  } catch (err: any) {
    error.value = err.message || 'Google Authentication failed';
    loading.value = false;
  }
}

onMounted(async () => {
  // Check if we are returning from Google OAuth redirect
  if (route.query.code && route.query.state) {
    loading.value = true;
    error.value = '';
    try {
      const providerRaw = localStorage.getItem('provider');
      if (!providerRaw) throw new Error("Missing initial provider tracking.");
      const provider = JSON.parse(providerRaw);

      if (provider.state !== route.query.state) {
        throw new Error("State parameters don't match.");
      }

      const redirectUrl = window.location.origin + '/login';
      await pb.collection('users').authWithOAuth2Code(
          provider.name,
          route.query.code as string,
          provider.codeVerifier,
          redirectUrl
      );
      
      router.push({ name: 'dashboard' });
    } catch (err: any) {
      error.value = err.message || 'Google Authentication failed processing callback.';
    } finally {
      loading.value = false;
      localStorage.removeItem('provider');
      // Clean up the URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});
</script>

<template>
  <div class="c-auth-page">
    <div class="c-auth-header">
      <button class="l-header__btn c-auth-lang-btn" @click="toggleLanguage" title="Change Language">
        <span class="l-header__btn-icon">🌐</span>
        <span class="l-header__btn-text"> {{ currentLanguage }}</span>
      </button>
    </div>

    <div class="c-auth-card">
      <h2 class="c-auth-card__title">{{ isLogin ? $t('auth.loginTitle') : $t('auth.signupTitle') }}</h2>
      <form @submit.prevent="handleSubmit" class="c-auth-card__form">
        <div v-if="!isLogin" class="c-auth-card__field">
          <label>{{ $t('auth.displayName') }}</label>
          <input v-model="name" type="text" :placeholder="$t('auth.yourName')" required />
        </div>

        <div class="c-auth-card__field">
          <label>{{ $t('auth.emailAddress') }}</label>
          <input v-model="email" type="email" :placeholder="$t('auth.emailPlaceholder')" required />
        </div>

        <div class="c-auth-card__field">
          <label>{{ $t('auth.password') }}</label>
          <input v-model="password" type="password" :placeholder="$t('auth.minPassword')" required minlength="8" />
        </div>

        <p v-if="error" class="c-auth-card__error">{{ error }}</p>

        <button type="submit" class="c-auth-card__button" :disabled="loading">
          {{ loading ? $t('auth.processing') : (isLogin ? $t('auth.loginBtn') : $t('auth.signupBtn')) }}
        </button>
      </form>

      <div class="c-auth-card__divider">
        <span>{{ $t('auth.or') }}</span>
      </div>

      <button @click="handleGoogleLogin" class="c-auth-card__google-btn" :disabled="loading" type="button">
        <svg class="c-auth-card__google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ $t('auth.continueGoogle') }}
      </button>

      <div class="c-auth-card__footer">
        <button @click="isLogin = !isLogin" class="c-auth-card__switch">
          {{ isLogin ? $t('auth.switchToSignup') : $t('auth.switchToLogin') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-auth-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-bg-page);
  position: relative;
  transition: background-color 0.3s ease;
}

.c-auth-header {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
}

.c-auth-lang-btn {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--color-text-main);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.c-auth-lang-btn:hover {
  background-color: var(--color-bg-page);
  border-color: var(--color-text-muted);
}

.c-auth-card {
  width: 100%;
  max-width: 420px;
  padding: 48px;
  background: var(--color-bg-modal);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
}

.c-auth-card__title {
  text-align: center;
  margin-bottom: 32px;
  color: var(--color-text-main);
  font-weight: 800;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}

.c-auth-card__field {
  margin-bottom: 20px;
}

.c-auth-card__field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-muted);
}

.c-auth-card__field input {
  width: 100%;
  padding: 12px 16px;
  background-color: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text-main);
  transition: all 0.2s ease;
}

.c-auth-card__field input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
}

.c-auth-card__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 20px;
  padding: 10px;
  background-color: rgba(220, 53, 69, 0.05);
  border-radius: 8px;
}

.c-auth-card__button {
  width: 100%;
  padding: 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(26, 115, 232, 0.2);
}

.c-auth-card__button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 6px 12px rgba(26, 115, 232, 0.3);
  transform: translateY(-1px);
}

.c-auth-card__button:active:not(:disabled) {
  transform: translateY(0);
}

.c-auth-card__button:disabled {
  background: var(--color-border);
  cursor: not-allowed;
  box-shadow: none;
}

.c-auth-card__divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}

.c-auth-card__divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border);
  z-index: 1;
}

.c-auth-card__divider span {
  background: var(--color-bg-modal);
  padding: 0 16px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  position: relative;
  z-index: 2;
}

.c-auth-card__google-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.c-auth-card__google-btn:hover {
  background: var(--color-bg-page);
  border-color: var(--color-text-muted);
}

.c-auth-card__google-icon {
  width: 20px;
  height: 20px;
}

.c-auth-card__footer {
  margin-top: 24px;
  text-align: center;
}

.c-auth-card__switch {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
}

.c-auth-card__switch:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .c-auth-card {
    border-radius: 0;
    height: 100vh;
    max-width: none;
    padding: 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: none;
  }
}
</style>
