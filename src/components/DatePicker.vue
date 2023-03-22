<template>
  <!-- :return-value.sync="date" -->
  <v-menu
    ref="menu"
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-model="date"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        v-bind="attrs"
        v-on="on"
        clearable
      />
    </template>

    <v-date-picker v-model="date" no-title scrollable>
      <v-spacer />

      <v-btn text color="primary" @click="menu = false"> Close </v-btn>
    </v-date-picker>
  </v-menu>
</template>

<script>
export default {
  name: "DatePickerMenu",
  props: {
    label: String,
    value: String,
  },
  data() {
    return {
      menu: false,
    }
  },
  methods: {
    dateInUtc: (input) =>
      new Date(
        new Date(input).getTime() + new Date().getTimezoneOffset() * 60000
      ),
  },
  computed: {
    date: {
      get() {
        // TODO: find nicer way
        if (!this.value) return null
        const date = new Date(this.value)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const day = date.getDate().toString().padStart(2, "0")
        return `${year}-${month}-${day}`
      },
      set(newVal) {
        // This is absurdly complex
        this.$emit("input", this.dateInUtc(newVal).toISOString())
      },
    },
  },
}
</script>
