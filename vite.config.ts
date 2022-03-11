/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import injectCss from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    Vue(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
      ],
      dts: true,
    }),
    injectCss(),
  ],

  build: {
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'lib/index.ts'),
      name: 'Vitar',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@mediapipe/face_mesh',
        '@mediapipe/camera_utils',
        '@mediapipe/drawing_utils',
      ],
      output: {
        inlineDynamicImports: false,
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },
})
