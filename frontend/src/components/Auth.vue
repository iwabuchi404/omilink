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
</script>

<template>
  <div class="c-auth-card">
    <h2 class="c-auth-card__title">{{ isLogin ? 'Login to OMI LINK' : 'Create Account' }}</h2>
    
    <form @submit.prevent="handleSubmit" class="c-auth-card__form">
      <div v-if="!isLogin" class="c-auth-card__field">
        <label>Display Name</label>
        <input v-model="name" type="text" placeholder="Your Name" required />
      </div>

      <div class="c-auth-card__field">
        <label>Email Address</label>
        <input v-model="email" type="email" placeholder="email@example.com" required />
      </div>

      <div class="c-auth-card__field">
        <label>Password</label>
        <input v-model="password" type="password" placeholder="Min 8 characters" required minlength="8" />
      </div>

      <p v-if="error" class="c-auth-card__error">{{ error }}</p>

      <button type="submit" class="c-auth-card__button" :disabled="loading">
        {{ loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up') }}
      </button>
    </form>

    <div class="c-auth-card__footer">
      <button @click="isLogin = !isLogin" class="c-auth-card__switch">
        {{ isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login" }}
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
