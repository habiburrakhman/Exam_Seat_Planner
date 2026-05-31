import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev
export default defineConfig({
  plugins: [react()],
  base: '/Exam_Seat_Planner/', // 👈 BARIS INI WAJIB ADA AGAR HALAMAN TIDAK PUTIH
})
