import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

const { VUE_APP_ANNOTATION_FIELD } = process.env

export default new Vuex.Store({
  state: {
    current_user: null,
    annotation_field: VUE_APP_ANNOTATION_FIELD || "annotation",
  },
  mutations: {
    set_current_user(state, user) {
      state.current_user = user
    },
  },
  actions: {},
  modules: {},
})
