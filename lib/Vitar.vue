<script lang="ts">
import '@unocss/reset/tailwind.css'
import 'uno.css'
export default {
  name: 'Vitar',
  inheritAttrs: false,
}
</script>
<script setup lang="ts">
const isLive2dLoad = ref(false)
const isCubismLoad = ref(false)
const isFaceMeshLoad = ref(false)
const isCameraUtilsLoad = ref(false)
const isDrawiingUtilsLoad = ref(false)
const Live2DLayer = shallowRef<any>()

const props = defineProps({
  model: {
    type: [Boolean, String],
    default: true,
  },
  realTime: {
    type: Boolean,
    default: true,
  },
  showMesh: {
    type: Boolean,
    default: false,
  },
  showCam: {
    type: Boolean,
    default: false,
  },
})
const isDev = import.meta.env.MODE === 'development'

if (props.realTime && !isDev && (!(window as any).FaceMesh || !(window as any).Camera || !(window as any).drawConnectors)) {
  useScriptTag(
    'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
    () => {
      isFaceMeshLoad.value = true
    },
    { async: true, crossOrigin: 'anonymous' },
  )
  useScriptTag(
    'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
    () => {
      isCameraUtilsLoad.value = true
    },
    { async: true, crossOrigin: 'anonymous' },
  )
  useScriptTag(
    'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
    () => {
      isDrawiingUtilsLoad.value = true
    },
    { async: true, crossOrigin: 'anonymous' },
  )
}
else {
  isFaceMeshLoad.value = true
  isCameraUtilsLoad.value = true
  isDrawiingUtilsLoad.value = true
}

if (props.model && (!(window as any).Live2D || !(window as any).Live2DCubismCore)) {
  useScriptTag(
    '/js/live2d.min.js',
    () => {
      isLive2dLoad.value = true
    },
    { async: true },
  )
  useScriptTag(
    '/js/live2dcubismcore.min.js',
    () => {
      isCubismLoad.value = true
    },
    { async: true },
  )
}
else {
  isLive2dLoad.value = true
  isCubismLoad.value = true
}

watch([isLive2dLoad, isCubismLoad, isFaceMeshLoad, isCameraUtilsLoad, isDrawiingUtilsLoad], () => {
  if (isLive2dLoad.value && isCubismLoad.value && isFaceMeshLoad.value && isCameraUtilsLoad.value && isDrawiingUtilsLoad.value && !Live2DLayer.value)
    import('./Live2D.vue').then(v => Live2DLayer.value = v.default)
})
</script>

<template>
  <template v-if="Live2DLayer">
    <Live2DLayer :model="model" :real-time="realTime" :show-cam="showCam" :show-mesh="showMesh" :cdn="!isDev" />
  </template>
</template>
