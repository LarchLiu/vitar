# Vitar

Vue live real-time avatar from your webcam in the browser. 

## Get Started

#### Npm

``` bash
$ npm install @cloudgeek/vitar --save
```

#### Yarn

``` bash
$ yarn add @cloudgeek/vitar
```

#### pnpm

``` bash
$ pnpm i @cloudgeek/vitar
```

## Usage
### Basic
#### Install Globally

```js
// main.js
import Vitar from '@cloudgeek/vitar'
import '@cloudgeek/vitar/dist/index.css'

const app = createApp(App)

app.use(Vitar).mount('#app')
```
```js
// your component
<template>
  <vitar />
<template>
```
#### Import Directly
```js
// your component
<script setup>
import { Vitar } from '@cloudgeek/vitar'
import '@cloudgeek/vitar/dist/index.css'
</script>

<template>
  <vitar show-mesh />
</template>
```

### Props

| Name           | Type             | Default          | Description |
| -------------- | :--------------: | :--------------: | -------------- |
| model          | boolean \| string| true             | true: use default model of hiyori, false: don't show model, string: url of model.|
| realTime       | boolean          | true             | whether to use mediapipe for real-time avatar.|
| showCam        | boolean          | false            | whether to show camera view.|
| showMesh       | boolean          | false            | whether to show mesh view.|

## Dev Base
- [Vite](https://vitejs.dev) - An extremely fast frontend tooling
- [Vue 3](https://vuejs.org/) - The Progressive
JavaScript Framework
- [Live2D](https://www.live2d.com/) - The technique of generating 2D animations.
- [PixiJS](https://github.com/pixijs/pixijs) - The HTML5 Creation Engine: Create beautiful digital content with the fastest, most flexible 2D WebGL renderer.
- [MediaPipe](https://mediapipe.dev/) - Cross-platform, customizable ML solutions for live and streaming media.
- [Kalidokit](https://github.com/yeemachine/kalidokit) - Blendshape and kinematics calculator for Mediapipe/Tensorflow.js Face, Eyes, Pose, and Finger tracking models.
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) - A PixiJS plugin to display Live2D models of any kind.


The example Live2D model hiyori (Cubism 4) is redistributed under Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).