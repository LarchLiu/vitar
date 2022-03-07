<script setup lang="ts">
import { Live2DModel } from 'pixi-live2d-display'
import { Application } from '@pixi/app'
import { Renderer } from '@pixi/core'
import { Ticker, TickerPlugin } from '@pixi/ticker'
import { InteractionManager } from '@pixi/interaction'
import * as Kalidokit from 'kalidokit'
import type * as c from '@mediapipe/camera_utils'
import type * as d from '@mediapipe/drawing_utils'
import type * as f from '@mediapipe/face_mesh'

// register the Ticker to support automatic updating of Live2D models
Application.registerPlugin(TickerPlugin)
Live2DModel.registerTicker(Ticker)

// // register the InteractionManager to support automatic interaction of Live2D models
Renderer.registerPlugin('interaction', InteractionManager)

const props = defineProps({
  model: [Boolean, String],
  cdn: Boolean,
  realTime: Boolean,
  showMesh: Boolean,
  showCam: Boolean,
})

const {
  Face,
  Vector: { lerp },
} = Kalidokit

let mpCamera: typeof c
let mpDrawing: typeof d
let mpFaceMesh: typeof f

const size = useStorage('live-model-size', Math.round(Math.min(window.innerHeight, (window.innerWidth) / 8)))
const position = useStorage('live-model-pos', {
  x: window.innerWidth - size.value - 30,
  y: window.innerHeight - size.value - 30,
})

const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const liveModel = ref<HTMLCanvasElement>()
const camView = ref<HTMLVideoElement>()
const guideCanvas = ref<HTMLCanvasElement>()
const showGuides = ref(false)

const { style: containerStyle } = useDraggable(frame as unknown as HTMLElement, { initialValue: position })
const { isDragging: handlerDown } = useDraggable(handler as unknown as HTMLElement, {
  onMove({ x, y }) {
    size.value = Math.max(10, Math.min(x - position.value.x, y - position.value.y) / 0.8536)
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
const modelUrl = computed(() =>
  typeof props.model === 'string'
    ? props.model
    : (props.model ? 'https://yeemachine.github.io/kalidoface-live2d-models/Demo/4.0/hiyori/hiyori_free_t06.model3.json' : props.model),
)
async function initLive2D() {
  if (modelUrl.value) {
    currentModel = await Live2DModel.from(modelUrl.value, { autoInteract: false })
    const { width, height } = currentModel

    const a = new Application({
      backgroundAlpha: 0,
      autoStart: true,
      width: width / 2,
      height: height / 3,
      view: liveModel.value,
    })

    a.stage.addChild(currentModel)

    currentModel.scale.set(1)
    currentModel.x = -width / 4
    currentModel.buttonMode = true
    currentModel.interactive = true

    currentModel.on('pointerdown', () => {
      // camView.value.style.visibility = showGuides.value ? 'visible' : 'hidden';
    })
  }
}
// draw connectors and landmarks on output canvas
const drawResults = (points: f.NormalizedLandmarkList) => {
  if (!showGuides.value || !guideCanvas.value || !camView.value || !points) return
  guideCanvas.value.width = camView.value.videoWidth
  guideCanvas.value.height = camView.value.videoHeight
  const canvasCtx = guideCanvas.value.getContext('2d')
  canvasCtx!.save()
  canvasCtx!.clearRect(0, 0, guideCanvas.value.width, guideCanvas.value.height)
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
const rigFace = (result: Kalidokit.TFace|undefined, lerpAmount = 0.7) => {
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
  drawResults(results.multiFaceLandmarks[0])
  animateLive2DModel(results.multiFaceLandmarks[0])
}

async function initMediapipe() {
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

  showGuides.value = props.showMesh
  const canvasCtx = guideCanvas.value!.getContext('2d')
  canvasCtx!.clearRect(0, 0, guideCanvas.value!.width, guideCanvas.value!.height)
  guideCanvas.value!.style.visibility = showGuides.value ? 'inline' : 'none'
  camView.value!.style.visibility = props.showCam ? 'visible' : '!invisible'

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
}
useEventListener('resize', fixPosition)
onMounted(async() => {
  fixPosition()
  await initLive2D()
  if (props.realTime)
    await initMediapipe()
})

</script>

<template>
  <div
    class="fixed z-10"
    :style="containerStyle"
  >
    <div
      v-if="model"
      ref="frame"
      class="rounded-full shadow bg-gray-400 bg-opacity-10 overflow-hidden object-cover"
      :style="frameStyle"
    >
      <canvas ref="liveModel" class="object-cover min-w-full min-h-full rounded-full" :style="frameStyle" />
    </div>
    <div
      v-if="model"
      ref="handler"
      class="absolute bottom-0 right-0 bg-green-500 rounded-full bg-main shadow opacity-50 shadow z-30 hover:opacity-100 dark:(border border-true-gray-700)"
      :style="handleStyle"
      :class="handlerDown ? '!opacity-100' : ''"
    />
    <div
      v-if="realTime"
      class="absolute bottom-0"
      style="transform: rotateY(180deg);"
      :style="[frameStyle, {right: `${size}px`}]"
    >
      <video ref="camView" class="absolute bottom-0 left-0 w-full h-auto invisible" />
      <canvas ref="guideCanvas" class="absolute bottom-0 left-0 w-full h-auto" />
    </div>
  </div>
</template>