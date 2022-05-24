<script lang="ts">
export default {
  name: 'Vitar',
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
const props = defineProps({
  model: {
    type: [Boolean, String],
    default: true,
  },
  mediaPipe: {
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
  zIndex: {
    type: Number,
    default: 9999,
  },
  display: {
    type: Object,
    default() {
      return {
        scale: 2,
        offsetX: 0,
        offsetY: 0,
      }
    },
  },
})
const isLive2dLoad = ref(false)
const isCubismLoad = ref(false)
const isFaceMeshLoad = ref(false)
const isCameraUtilsLoad = ref(false)
const isDrawiingUtilsLoad = ref(false)
const Live2DLayer = shallowRef<any>()

const isDev = import.meta.env.MODE === 'development'

const vm = getCurrentInstance()!

async function create() {
  if (props.mediaPipe || props.model)
    import('./Live2D.vue').then(v => Live2DLayer.value = v.default)
}

if (props.mediaPipe && (window as any).FaceMesh && (window as any).Camera && (window as any).drawConnectors && (window as any).Live2D && (window as any).Live2DCubismCore) {
  onMounted(create)
}
else {
  if (props.mediaPipe && !isDev && (!(window as any).FaceMesh || !(window as any).Camera || !(window as any).drawConnectors)) {
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

  if (!(window as any).Live2D || !(window as any).Live2DCubismCore) {
    useScriptTag(
      'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
      () => {
        isLive2dLoad.value = true
      },
      { async: true },
    )
    useScriptTag(
      'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
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
}

watch([isLive2dLoad, isCubismLoad, isFaceMeshLoad, isCameraUtilsLoad, isDrawiingUtilsLoad], () => {
  if (isLive2dLoad.value && isCubismLoad.value && isFaceMeshLoad.value && isCameraUtilsLoad.value && isDrawiingUtilsLoad.value && !Live2DLayer.value) {
    if (vm.isMounted)
      create()
    else
      onMounted(create, vm)
  }
})
</script>

<template>
  <template v-if="Live2DLayer">
    <Live2DLayer
      :model="model" :media-pipe="mediaPipe" :show-cam="showCam"
      :show-mesh="showMesh" :cdn="!isDev" :z-index="zIndex" :display="display"
    />
  </template>
</template>
