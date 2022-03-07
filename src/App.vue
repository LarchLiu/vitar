<script setup lang="ts">
import { Vitar } from '../lib/index'
const showCam = ref(false)
const showMesh = ref(true)
const realTime = ref(true)
const model = ref(true)
const zIndex = ref(100)
</script>
<template>
  <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
    <vitar :show-mesh="showMesh" :z-index="zIndex" :show-cam="showCam" :model="model" :real-time="realTime" />
  </main>
</template>
