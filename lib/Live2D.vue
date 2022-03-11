<script setup lang="ts">
import { Live2DModel } from 'pixi-live2d-display'
import { Application } from '@pixi/app'
import { Ticker, TickerPlugin } from '@pixi/ticker'
import type { TFace } from 'kalidokit'
import { Face, Vector } from 'kalidokit'
import type * as c from '@mediapipe/camera_utils'
import type * as d from '@mediapipe/drawing_utils'
import type * as f from '@mediapipe/face_mesh'

// register the Ticker to support automatic updating of Live2D models
Application.registerPlugin(TickerPlugin)
Live2DModel.registerTicker(Ticker)

const props = defineProps({
  model: [Boolean, String],
  cdn: Boolean,
  mediaPipe: Boolean,
  showMesh: Boolean,
  showCam: Boolean,
  zIndex: Number,
  display: Object,
})

const { lerp } = Vector

let mpCamera: typeof c
let mpDrawing: typeof d
let mpFaceMesh: typeof f

const minSize = 80
const size = useStorage('live-model-size', Math.round(Math.max(minSize, Math.min(window.innerHeight, (window.innerWidth) / 8))))
const position = useStorage('live-model-pos', {
  x: window.innerWidth - size.value - 30,
  y: window.innerHeight - size.value - 30,
})

const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const liveModel = ref<HTMLCanvasElement>()
const camView = ref<HTMLVideoElement>()
const meshView = ref<HTMLCanvasElement>()
const loaded = ref(false)
const modelSize = ref(0)
const display = reactive({
  scale: 0,
  offsetX: 0,
  offsetY: 0,
})

const { style: containerStyle } = useDraggable(frame as unknown as HTMLElement, { initialValue: position })
const { isDragging: handlerDown } = useDraggable(handler as unknown as HTMLElement, {
  onMove({ x, y }) {
    size.value = Math.max(minSize, Math.min(x - position.value.x, y - position.value.y) / 0.8536)
  },
})

const frameStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
}))

const handleStyle = computed(() => ({
  width: '14px',
  height: '14px',
  // 0.5 + 0.5 / sqrt(2)
  top: `${size.value * 0.8536 - 7}px`,
  left: `${size.value * 0.8536 - 7}px`,
  cursor: 'nwse-resize',
}))

// const modelUrl = '/models/hiyori/hiyori_pro_t10.model3.json'
let currentModel: any
let pixiApp: Application
const modelUrl = computed(() =>
  typeof props.model === 'string'
    ? props.model
    : (props.model ? 'https://raw.githubusercontent.com/Live2D/CubismWebSamples/develop/Samples/Resources/Hiyori/Hiyori.model3.json' : props.model),
)
const setDisplay = () => {
  const scale = Math.max(0.1, display.scale / 10)
  const offsetX = (scale - 1) / 2 - display.offsetX / 20
  const offsetY = display.offsetY / 20
  if (currentModel) {
    currentModel.scale.set(scale)
    currentModel.x = -modelSize.value * offsetX
    currentModel.y = -modelSize.value * offsetY
  }
}
const initDisplay = () => {
  display.scale = props.display!.scale * 10
  display.offsetX = props.display!.offsetX
  display.offsetY = props.display!.offsetY
  setDisplay()
}

async function initLive2D() {
  if (modelUrl.value) {
    currentModel = await Live2DModel.from(modelUrl.value, { autoInteract: false })
    const { width, height } = currentModel
    modelSize.value = Math.min(width, height)

    pixiApp = new Application({
      backgroundAlpha: 0,
      autoStart: true,
      width: modelSize.value,
      height: modelSize.value,
      view: liveModel.value,
    })

    pixiApp.stage.addChild(currentModel)
    initDisplay()
    currentModel.buttonMode = true
    currentModel.interactive = true

    // currentModel.on('pointerdown', () => {
    //   // camView.value.style.visibility = showGuides.value ? 'visible' : 'hidden';
    // })
  }
}
// draw connectors and landmarks on output canvas
const drawResults = (points: f.NormalizedLandmarkList) => {
  if (!props.showMesh || !meshView.value || !camView.value || !points) return
  meshView.value.width = camView.value.videoWidth
  meshView.value.height = camView.value.videoHeight
  const canvasCtx = meshView.value.getContext('2d')
  canvasCtx!.save()
  canvasCtx!.clearRect(0, 0, meshView.value.width, meshView.value.height)
  // Use `Mediapipe` drawing functions
  mpDrawing.drawConnectors(canvasCtx!, points, mpFaceMesh.FACEMESH_TESSELATION, {
    color: '#C0C0C070',
    lineWidth: 1,
  })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_RIGHT_EYE,
    { color: '#FF3030' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_RIGHT_EYEBROW,
    { color: '#FF3030' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_LEFT_EYE,
    { color: '#30FF30' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_LEFT_EYEBROW,
    { color: '#30FF30' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_FACE_OVAL,
    { color: '#E0E0E0' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_RIGHT_IRIS,
    { color: '#FF3030' })
  mpDrawing.drawConnectors(
    canvasCtx!, points, mpFaceMesh.FACEMESH_LEFT_IRIS,
    { color: '#30FF30' })
}

// update live2d model internal state
const rigFace = (result: TFace|undefined, lerpAmount = 0.7) => {
  if (!currentModel || !result) return
  const coreModel: any = currentModel.internalModel.coreModel

  currentModel.internalModel.motionManager.update = () => {
    // disable default blink animation
    currentModel.internalModel.eyeBlink = undefined

    coreModel.setParameterValueById(
      'ParamEyeBallX',
      lerp(result.pupil.x, coreModel.getParameterValueById('ParamEyeBallX'), lerpAmount),
    )
    coreModel.setParameterValueById(
      'ParamEyeBallY',
      lerp(result.pupil.y, coreModel.getParameterValueById('ParamEyeBallY'), lerpAmount),
    )

    // X and Y axis rotations are swapped for Live2D parameters
    // because it is a 2D system and KalidoKit is a 3D system
    coreModel.setParameterValueById(
      'ParamAngleX',
      lerp(result.head.degrees.y, coreModel.getParameterValueById('ParamAngleX'), lerpAmount),
    )
    coreModel.setParameterValueById(
      'ParamAngleY',
      lerp(result.head.degrees.x, coreModel.getParameterValueById('ParamAngleY'), lerpAmount),
    )
    coreModel.setParameterValueById(
      'ParamAngleZ',
      lerp(result.head.degrees.z, coreModel.getParameterValueById('ParamAngleZ'), lerpAmount),
    )

    // update body params for models without head/body param sync
    const dampener = 0.3
    coreModel.setParameterValueById(
      'ParamBodyAngleX',
      lerp(result.head.degrees.y * dampener, coreModel.getParameterValueById('ParamBodyAngleX'), lerpAmount),
    )
    coreModel.setParameterValueById(
      'ParamBodyAngleY',
      lerp(result.head.degrees.x * dampener, coreModel.getParameterValueById('ParamBodyAngleY'), lerpAmount),
    )
    coreModel.setParameterValueById(
      'ParamBodyAngleZ',
      lerp(result.head.degrees.z * dampener, coreModel.getParameterValueById('ParamBodyAngleZ'), lerpAmount),
    )

    // Simple example without winking.
    // Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
    const stabilizedEyes = Face.stabilizeBlink(
      {
        l: lerp(result.eye.l, coreModel.getParameterValueById('ParamEyeLOpen'), 0.7),
        r: lerp(result.eye.r, coreModel.getParameterValueById('ParamEyeROpen'), 0.7),
      },
      result.head.y,
    )
    // eye blink
    coreModel.setParameterValueById('ParamEyeLOpen', stabilizedEyes.l)
    coreModel.setParameterValueById('ParamEyeROpen', stabilizedEyes.r)

    // mouth
    coreModel.setParameterValueById(
      'ParamMouthOpenY',
      lerp(result.mouth.y, coreModel.getParameterValueById('ParamMouthOpenY'), 0.3),
    )
    // Adding 0.3 to ParamMouthForm to make default more of a "smile"
    coreModel.setParameterValueById(
      'ParamMouthForm',
      0.3 + lerp(result.mouth.x, coreModel.getParameterValueById('ParamMouthForm'), 0.3),
    )
  }
}

const animateLive2DModel = (points: f.NormalizedLandmarkList) => {
  if (!currentModel || !points) return

  let riggedFace

  if (points) {
    // use kalidokit face solver
    riggedFace = Face.solve(points, {
      runtime: 'mediapipe',
      video: camView.value,
    })
    rigFace(riggedFace, 0.5)
  }
}

const onResults = (results: f.Results) => {
  if (!loaded.value && results.multiFaceLandmarks[0])
    loaded.value = true
  drawResults(results.multiFaceLandmarks[0])
  animateLive2DModel(results.multiFaceLandmarks[0])
}

async function initMediapipe() {
  if (!props.mediaPipe)
    return
  if (props.cdn) {
    mpFaceMesh = window as any
    mpCamera = window as any
    mpDrawing = window as any
  }
  else {
    mpFaceMesh = (await import('@mediapipe/face_mesh')).default
    mpCamera = (await import('@mediapipe/camera_utils')).default
    mpDrawing = (await import('@mediapipe/drawing_utils')).default
  }

  const canvasCtx = meshView.value!.getContext('2d')
  canvasCtx!.clearRect(0, 0, meshView.value!.width, meshView.value!.height)
  meshView.value!.style.visibility = props.showMesh ? 'inline' : 'none'
  camView.value!.style.visibility = props.showCam ? 'visible' : 'hidden'

  const faceMesh = new mpFaceMesh.FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${mpFaceMesh.VERSION}/${file}`
    },
  })

  const solutionOptions = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8,
  }

  faceMesh.setOptions(solutionOptions)

  faceMesh.onResults(onResults)

  const camera = new mpCamera.Camera(camView.value!, {
    onFrame: async() => {
      await faceMesh.send({ image: camView.value! })
    },
    width: 640,
    height: 480,
  })
  camera.start()
}

function fixPosition() {
  // move back if the camera is outside of the canvas
  if (position.value.x >= window.innerWidth)
    position.value.x = window.innerWidth - size.value - 30
  if (position.value.y >= window.innerHeight)
    position.value.y = window.innerHeight - size.value - 30
  if (position.value.x < 0)
    position.value.x = 0
  if (position.value.y < 0)
    position.value.y = 0
}

watch(() => props.showCam, () => {
  if (props.mediaPipe)
    camView.value!.style.visibility = props.showCam ? 'visible' : 'hidden'
})

watch(() => props.showMesh, () => {
  if (props.mediaPipe) {
    const canvasCtx = meshView.value!.getContext('2d')
    canvasCtx!.clearRect(0, 0, meshView.value!.width, meshView.value!.height)
    meshView.value!.style.visibility = props.showMesh ? 'inline' : 'none'
  }
})

watch(() => props.model, async() => {
  if (pixiApp && currentModel) {
    pixiApp.destroy()
    currentModel = null
    await initLive2D()
  }
})

watch(() => props.display, () => {
  initDisplay()
})

watch(display, () => {
  setDisplay()
})

useEventListener('resize', fixPosition)

onMounted(async() => {
  fixPosition()
  await initLive2D()
  await initMediapipe()
})

</script>

<template>
  <div
    class="container"
    :style="[containerStyle, {zIndex}]"
  >
    <div
      v-if="model"
      ref="frame"
      class="frame"
      :style="frameStyle"
    >
      <canvas ref="liveModel" class="model" :style="frameStyle" />
    </div>
    <div
      v-if="model"
      ref="handler"
      class="handler"
      :style="handleStyle"
      :class="[handlerDown ? 'opacity-full' : '', loaded ? 'bg-green' : 'bg-red']"
    />
    <div
      v-if="mediaPipe"
      class="media-pipe"
      style="transform: rotateY(180deg);"
      :style="[frameStyle, {right: `${size}px`}]"
    >
      <video ref="camView" class="camera" />
      <canvas ref="meshView" class="mesh" />
    </div>
    <div
      v-if="mediaPipe && showMesh && size > 120"
      class="panel" :style="[frameStyle, {zIndex: zIndex! + 1, right: `${size}px`}]"
    >
      <div>
        s:
        <button class="vitar-btn" @click="display.scale--">
          -
        </button>
        <button class="vitar-btn" @click="display.scale++">
          +
        </button>
        {{ `${Math.max(0.1, display.scale / 10)}` }}
      </div>
      <div>
        x:
        <button class="vitar-btn" @click="display.offsetX--">
          -
        </button>
        <button class="vitar-btn" @click="display.offsetX++">
          +
        </button>
        {{ `${display.offsetX}` }}
      </div>
      <div>
        y:
        <button class="vitar-btn" @click="display.offsetY--">
          -
        </button>
        <button class="vitar-btn" @click="display.offsetY++">
          +
        </button>
        {{ `${display.offsetY}` }}
      </div>
    </div>
  </div>
</template>
<style scoped>
.container {
  position: fixed;
}
.frame {
  overflow: hidden;
  --tw-shadow-color: 0, 0, 0;
  --tw-shadow: 0 1px 3px 0 rgba(var(--tw-shadow-color), 0.1), 0 1px 2px 0 rgba(var(--tw-shadow-color), 0.06);
  --tw-bg-opacity: 0.1;
  background-color: rgba(156, 163, 175, var(--tw-bg-opacity));
  -webkit-box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  border-radius: 9999px;
  -o-object-fit: cover;
  object-fit: cover;
}
.model {
  -o-object-fit: cover;
  object-fit: cover;
  min-width: 100%;
  min-height: 100%;
  border-radius: 9999px;
}
.handler {
  position: absolute;
  bottom: 0;
  right: 0;
  --tw-shadow-color: 0, 0, 0;
  --tw-shadow: 0 1px 3px 0 rgba(var(--tw-shadow-color), 0.1), 0 1px 2px 0 rgba(var(--tw-shadow-color), 0.06);
  -webkit-box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  border-radius: 9999px;
  opacity: 0.5;
}
.opacity-full,
.handler:hover {
  opacity: 1;
}
.bg-green {
  background-color: rgba(16, 185, 129);
}
.bg-red {
  background-color: rgba(239, 68, 68);
}
.media-pipe {
  position: absolute;
  bottom: 0;
}
.panel {
  position: absolute;
  text-align: left;
  top: 0;
}
.camera,
.mesh {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
}
.vitar-btn {
  margin-right: 0.25rem;
}
</style>
