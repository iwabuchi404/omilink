<script setup lang="ts">
import { ref } from 'vue';
import pb from '../lib/pocketbase';

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const name = ref('');
const error = ref('');
const loading = ref(false);

const emit = defineEmits(['auth-success']);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    if (isLogin.value) {
      // Login
      await pb.collection('users').authWithPassword(email.value, password.value);
    } else {
      // Sign Up
      const data = {
        email: email.value,
        password: password.value,
        passwordConfirm: password.value,
        name: name.value,
      };
      await pb.collection('users').create(data);
      // Auto login after signup
      await pb.collection('users').authWithPassword(email.value, password.value);
    }
    emit('auth-success');
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
    await pb.collection('users').authWithOAuth2({ provider: 'google' });
    emit('auth-success');
  } catch (err: any) {
    error.value = err.message || 'Google Authentication failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
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
</template>

<style scoped>
.c-auth-card {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.c-auth-card__title {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
}

.c-auth-card__field {
  margin-bottom: 15px;
}

.c-auth-card__field label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 5px;
  color: #666;
}

.c-auth-card__field input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.c-auth-card__error {
  color: #dc3545;
  font-size: 0.85rem;
  margin-bottom: 15px;
}

.c-auth-card__button {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.c-auth-card__button:hover {
  background: #0056b3;
}

.c-auth-card__button:disabled {
  background: #ccc;
}

.c-auth-card__divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}
.c-auth-card__divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #eee;
  z-index: 1;
}
.c-auth-card__divider span {
  background: white;
  padding: 0 10px;
  color: #999;
  font-size: 0.85rem;
  position: relative;
  z-index: 2;
}

.c-auth-card__google-btn {
  width: 100%;
  padding: 10px;
  background: white;
  color: #444;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s;
}
.c-auth-card__google-btn:hover {
  background: #f8f9fa;
}
.c-auth-card__google-icon {
  width: 20px;
  height: 20px;
}

.c-auth-card__footer {
  margin-top: 20px;
  text-align: center;
}

.c-auth-card__switch {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9rem;
}

.c-auth-card__switch:hover {
  text-decoration: underline;
}
</style>
