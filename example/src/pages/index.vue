<script setup lang="ts">
import { Vitar } from '@cloudgeek/vitar'
import { isDark, toggleDark } from '~/composables'

const showCam = ref(false)
const showMesh = ref(true)
const model = ref<boolean | string>(true)
const display = reactive({
  scale: 2,
  offsetX: 0,
  offsetY: 0,
})
const models = ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice']
const setModel = (name: string) => {
  model.value = `https://raw.githubusercontent.com/Live2D/CubismWebSamples/develop/Samples/Resources/${name}/${name}.model3.json`
  if (name === 'Rice')
    display.offsetX = -20
  else
    display.offsetX = 0
}
</script>

<template>
  <div>
    <vitar :show-mesh="showMesh" :show-cam="showCam" :z-index="666" :model="model" :display="display" />
    <div i-carbon-user-avatar text-4xl inline-block />
    <p>
      <a rel="noreferrer" href="https://github.com/LarchLiu/vitar" target="_blank">
        Vitar
      </a>
    </p>
    <p>
      <em text-sm op75>Live real-time avatar</em>
    </p>

    <div mt-6 flex justify="center" gap-2>
      <button v-for="name in models" :key="name" class="btn" @click="setModel(name)">
        {{ name }}
      </button>
    </div>

    <nav text-xl mt-6 inline-flex gap-2>
      <button class="icon-btn !outline-none" @click="showCam = !showCam">
        <div i-carbon-camera :class="showCam ? '!opacity-100' : '!opacity-40'" />
      </button>
      <button class="icon-btn !outline-none" @click="showMesh = !showMesh">
        <div i-carbon-3d-print-mesh :class="showMesh ? '!opacity-100' : '!opacity-40'" />
      </button>
      <div class="w-1px mx-2 opacity-20 bg-current" />
      <button class="icon-btn !outline-none" @click="toggleDark()">
        <div v-if="isDark" i-carbon-moon />
        <div v-else i-carbon-sun />
      </button>

      <a
        class="icon-btn"
        i-carbon-logo-github
        rel="noreferrer"
        href="https://github.com/LarchLiu/vitar"
        target="_blank"
        title="GitHub"
      />
    </nav>
  </div>
</template>
