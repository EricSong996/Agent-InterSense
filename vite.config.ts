import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 项目站: 把 base 改成 '/仓库名/'，例如 '/Agent/'
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Agent-InterSense/' : '/',
  plugins: [react(), tailwindcss()],
})
