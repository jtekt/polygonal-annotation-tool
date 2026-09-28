import { createApp } from 'vue'
import { QueryFilterPlugin } from '@jtekt/iss-query-filters'
import { registerPlugins } from '@/plugins'
import App from './App.vue'

const app = createApp(App)

registerPlugins(app)
app.use(QueryFilterPlugin)
app.mount('#app')
