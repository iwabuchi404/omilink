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
const isForgotPassword = ref(false);
const resetSuccess = ref(false);

async function handlePasswordReset() {
  error.value = '';
  resetSuccess.value = false;
  
  if (!email.value) {
    error.value = 'Please enter your email address.';
    return;
  }
  
  loading.value = true;
  try {
    await pb.collection('users').requestPasswordReset(email.value);
    resetSuccess.value = true;
  } catch (err: any) {
    error.value = err.message || 'Failed to send reset email.';
  } finally {
    loading.value = false;
  }
}

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
      <button class="c-auth-lang-btn" @click="toggleLanguage" title="Change Language">
        <span class="l-header__btn-icon">🌐</span>
        <span class="l-header__btn-text"> {{ currentLanguage }}</span>
      </button>
    </div>

    <div class="c-auth-card">
      <div class="c-auth-card__brand">
        <img src="/logo.svg" alt="OmiLink" class="c-auth-logo" />
        <h1 class="c-auth-title">OmiLink</h1>
      </div>

      <template v-if="isForgotPassword">
        <h2 class="c-auth-card__title">{{ $t('auth.forgotPassword') }}</h2>
        <p class="c-auth-card__desc">{{ $t('auth.resetDesc') }}</p>

        <form @submit.prevent="handlePasswordReset" class="c-auth-card__form">
          <div class="c-auth-card__field">
            <label>{{ $t('auth.emailAddress') }}</label>
            <input v-model="email" type="email" :placeholder="$t('auth.emailPlaceholder')" required />
          </div>

          <p v-if="error" class="c-auth-card__error">{{ error }}</p>
          <p v-if="resetSuccess" class="c-auth-card__success">{{ $t('auth.resetEmailSent') }}</p>

          <button type="submit" class="c-auth-card__button" :disabled="loading || resetSuccess">
            {{ loading ? $t('auth.processing') : $t('auth.sendResetEmail') }}
          </button>
        </form>

        <div class="c-auth-card__footer" style="margin-top: 24px;">
          <button @click="isForgotPassword = false; resetSuccess = false; error = '';" class="c-auth-card__switch">
            ← {{ $t('auth.backToLogin') }}
          </button>
        </div>
      </template>

      <template v-else>
        <h2 class="c-auth-card__title">{{ isLogin ? $t('auth.loginTitle') : $t('auth.signupTitle') }}</h2>
        <form @submit.prevent="handleSubmit" class="c-auth-card__form">
          <div v-if="!isLogin" class="c-auth-card__field">
            <label>{{ $t('auth.displayName') }}</label>
            <input v-model="name" type="text" :placeholder="$t('auth.yourName')" required />
          </div>

          <div class="c-auth-card__field">
            <label>{{ $t('auth.emailAddress') }}</label>
            <input v-model="email" type="email" :placeholder="$t('auth.emailPlaceholder')" required autocomplete="email" autocapitalize="none" />
          </div>

          <div class="c-auth-card__field">
            <label>{{ $t('auth.password') }}</label>
            <input v-model="password" type="password" :placeholder="$t('auth.minPassword')" required minlength="8" />
            <div v-if="isLogin" class="c-auth-card__forgot-container">
              <button type="button" @click="isForgotPassword = true; error = '';" class="c-auth-card__forgot-link">
                {{ $t('auth.forgotPassword') }}
              </button>
            </div>
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
          <button @click="isLogin = !isLogin; error = '';" class="c-auth-card__switch">
            {{ isLogin ? $t('auth.switchToSignup') : $t('auth.switchToLogin') }}
          </button>
        </div>
      </template>
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
  padding: 10px 20px;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--color-text-main);
  box-shadow: 
    inset 1px 1px 0 rgba(255,255,255,0.8),
    2px 3px 5px rgba(0,0,0,0.05);
  transition: all 0.25s ease;
}

.c-auth-lang-btn:hover {
  background-color: white;
  transform: translateY(-1px);
  box-shadow: 4px 6px 12px rgba(80, 50, 30, 0.08);
}

.c-auth-lang-btn:active {
  transform: translateY(0);
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.06);
}

.c-auth-card {
  width: 100%;
  max-width: 440px;
  padding: 56px 48px;
  background: var(--color-bg-modal);
  border-radius: 24px;
  /* Premium multi-layered shadow */
  box-shadow: 
    0 10px 40px rgba(0,0,0,0.1),
    0 20px 80px rgba(0,0,0,0.05),
    inset 1.5px 1.5px 0 rgba(255,255,255,0.8);
  border: 1px solid var(--color-card-border);
  position: relative;
}

[data-theme="dark"] .c-auth-card {
  box-shadow: 
    0 20px 50px rgba(0,0,0,0.4),
    inset 1px 1px 1px rgba(255,255,170,0.02);
}

.c-auth-card__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.c-auth-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 10px rgba(176, 80, 64, 0.2));
}

.c-auth-title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-main);
  margin: 0;
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
  padding: 14px 18px;
  background-color: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text-main);
  transition: all 0.25s ease;
  /* Sunken inset effect */
  box-shadow: 
    inset 2px 2px 5px rgba(0,0,0,0.06),
    inset -2px -2px 5px rgba(255,255,255,0.7);
}

.c-auth-card__field input:focus {
  border-color: var(--color-accent);
  outline: none;
  background-color: var(--color-bg-surface);
  box-shadow: 
    inset 1px 1px 3px rgba(0,0,0,0.1),
    0 0 0 3px rgba(176, 80, 64, 0.1);
}

[data-theme="dark"] .c-auth-card__field input {
  box-shadow: 
    inset 2px 2px 5px rgba(0,0,0,0.4),
    inset -1px -1px 2px rgba(255,255,170,0.02);
}

.c-auth-card__error, .c-auth-card__success {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 8px;
}

.c-auth-card__error {
  color: var(--color-danger);
  background-color: rgba(220, 53, 69, 0.05);
}

.c-auth-card__success {
  color: #0f5132;
  background-color: #d1e7dd;
  border: 1px solid #badbcc;
}

.c-auth-card__desc {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
}

.c-auth-card__forgot-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.c-auth-card__forgot-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.c-auth-card__forgot-link:hover {
  text-decoration: underline;
}

.c-auth-card__button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #c05848, var(--color-accent));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.2),
    0 6px 15px rgba(176, 80, 64, 0.25);
  letter-spacing: -0.01em;
}

.c-auth-card__button:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 10px 25px rgba(176, 80, 64, 0.35);
  transform: translateY(-2px);
}

.c-auth-card__button:active:not(:disabled) {
  transform: translateY(0.5px);
  box-shadow: inset 2px 3px 6px rgba(0,0,0,0.2);
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
  padding: 14px;
  background: linear-gradient(145deg, var(--color-bg-surface), var(--color-bg-page));
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  transition: all 0.25s ease;
  box-shadow: 
    inset 1px 1px 0 rgba(255,255,255,0.8),
    2px 4px 8px rgba(0,0,0,0.05);
}

.c-auth-card__google-btn:hover:not(:disabled) {
  background: var(--color-bg-surface);
  transform: translateY(-1px);
  box-shadow: 4px 8px 16px rgba(80, 50, 30, 0.08);
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
