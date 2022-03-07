import type { App } from 'vue'
import Vitar from './Vitar.vue'

const VitarPlugin = {
  install(app: App) {
    app.component(Vitar.name, Vitar)
  },
}
// export const vitar = Vitar
export default VitarPlugin
export {
  Vitar,
}
