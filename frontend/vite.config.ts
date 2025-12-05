import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: process.env.VITE_SERVER_HOST || '0.0.0.0', // 监听地址，从环境变量读取，默认 0.0.0.0
    port: parseInt(process.env.VITE_SERVER_PORT || '5173', 10), // 监听端口，从环境变量读取，默认 5173
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    open: false, // 不自动打开浏览器
  },
})
