import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

Vue.use(Vuetify)

export default new Vuetify({
    icons: {
        iconfont: 'mdi', // default - only for display purposes
    },
    theme: {
        themes: {
            light: {
                primary: '#c00000',
            },
            dark: {
                primary: '#c00000',
            },
        },
    },
})
