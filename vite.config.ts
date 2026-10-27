import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Configuración de servidor de desarrollo
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  
  // Configuración de build para producción
  build: {
    outDir: 'dist',
    sourcemap: false, // Desactivar en producción para reducir tamaño
    minify: 'esbuild', // esbuild viene incluido por defecto
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['date-fns', 'uuid'],
          ui: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimizaciones
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  
  // Resolución de alias
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
