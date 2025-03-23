import fs from 'fs'

export default {
  server: {
    host: true, // Listen on all local IPs
    port: 5173, // Default Vite port
  },
  base: './', // This makes all asset paths relative instead of absolute
  build: {
    outDir: 'dist', // Output directory (you can change this)
    assetsDir: 'assets', // Where to put assets
    emptyOutDir: true, // Clean the output directory before build
  }
} 