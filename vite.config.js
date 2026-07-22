import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/daily-task/',
  plugins: [tailwindcss()],
});