<script setup lang="ts">
import { Vitar } from '../lib/index'
const showCam = ref(false)
const showMesh = ref(true)
const mediaPipe = ref(true)
const model = ref<boolean | string>(true)
const zIndex = ref(100)
const scale = ref(2)
const offsetX = ref(0)
const offsetY = ref(0)
const models = ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice']
const setModel = (name: string) => {
  model.value = `https://raw.githubusercontent.com/Live2D/CubismWebSamples/develop/Samples/Resources/${name}/${name}.model3.json`
  if (name === 'Rice')
    offsetX.value = -20
  else
    offsetX.value = 0
}
</script>
<template>
  <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
    <vitar
      :show-mesh="showMesh" :z-index="zIndex" :show-cam="showCam" :model="model"
      :media-pipe="mediaPipe" :display="{scale, offsetX, offsetY}"
    />
    <button class="btn" m="4" @click="showCam = !showCam">
      show camera
    </button>
    <button class="btn" @click="showMesh = !showMesh">
      show mesh
    </button>
    <div>
      <button v-for="name in models" :key="name" class="btn" @click="setModel(name)">
        {{ name }}
      </button>
    </div>
    <div>
      <button class="btn" @click="scale++">
        scale++
      </button>
      <button class="btn" @click="scale--">
        scale--
      </button>
      <button class="btn" @click="offsetX++">
        x++
      </button>
      <button class="btn" @click="offsetX--">
        x--
      </button>
      <button class="btn" @click="offsetY++">
        y++
      </button>
      <button class="btn" @click="offsetY--">
        y--
      </button>
    </div>
  </main>
</template>
<style>
.btn {
  padding: 0.25rem 1rem;
}
</style>
