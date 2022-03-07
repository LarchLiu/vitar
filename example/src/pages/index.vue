<script setup lang="ts">
import { Vitar } from '@cloudgeek/vitar'
import '@cloudgeek/vitar/dist/index.css'

const showCam = ref(false)
const showMesh = ref(true)
</script>

<template>
  <div>
    <vitar :show-mesh="showMesh" :show-cam="showCam" :z-index="666" />
    <div i-carbon-user-avatar text-4xl inline-block />
    <p>
      <a rel="noreferrer" href="https://github.com/LarchLiu/vitar" target="_blank">
        Vitar
      </a>
    </p>
    <p>
      <em text-sm op75>Live real-time avatar</em>
    </p>

    <div py-4 />
    <nav text-xl mt-6 inline-flex gap-2>
      <button class="icon-btn !outline-none" @click="showCam = !showCam">
        <div i-carbon-camera :class="showCam ? '!opacity-100' : '!opacity-40'" />
      </button>
      <button class="icon-btn !outline-none" @click="showMesh = !showMesh">
        <div i-carbon-3d-print-mesh :class="showMesh ? '!opacity-100' : '!opacity-40'" />
      </button>
    </nav>
  </div>
</template>
