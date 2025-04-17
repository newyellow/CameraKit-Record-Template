import { defineConfig } from 'vite'
import fs from 'fs'

export default defineConfig({
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/util']
  },
  server: {
    host: true, // Listen on all local IPs
    port: 5173, // Default Vite port
    https: {
      key: fs.readFileSync('YOUR-KEY.pem'), // Path to your key file
      cert: fs.readFileSync('YOUR-CERT.pem'), // Path to your cert file
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  base: './', // This makes all asset paths relative instead of absolute
  worker: {
    format: 'es',
    plugins: [],
  },
  build: {
    outDir: 'dist', // Output directory (you can change this)
    assetsDir: 'assets', // Where to put assets
    emptyOutDir: true, // Clean the output directory before build
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core', '@ffmpeg/util']
        }
      }
    }
  }
}) 