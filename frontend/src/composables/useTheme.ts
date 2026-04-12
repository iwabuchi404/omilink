import { ref, onMounted } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

export function useTheme() {
  const theme = ref<Theme>((localStorage.getItem('omi_theme') as Theme) || 'auto');

  const applyTheme = (t: Theme) => {
    let effectiveTheme: 'light' | 'dark' = 'light';
    
    if (t === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = t;
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('omi_theme', t);
  };

  const toggleTheme = () => {
    if (theme.value === 'light') {
      theme.value = 'dark';
    } else if (theme.value === 'dark') {
      theme.value = 'auto';
    } else {
      theme.value = 'light';
    }
    applyTheme(theme.value);
  };

  onMounted(() => {
    applyTheme(theme.value);

    // Watch for system theme changes if set to auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme('auto');
      }
    });
  });

  return {
    theme,
    toggleTheme,
    applyTheme
  };
}
