<template>
  <v-row dense>
    <v-col>
      <v-card outlined>
        <v-expansion-panels flat>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <span>
                <v-icon>mdi-magnify</v-icon>
                <span>{{ $t("Query settings") }}</span>
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row align="baseline">
                <v-col cols="">
                  <DatePicker label="From" v-model="from" />
                </v-col>
                <v-col cols="">
                  <DatePicker label="To" v-model="to" />
                </v-col>
              </v-row>

              <v-row v-for="(key, index) in Object.keys(filters)" :key="index">
                <v-col cols="">
                  <v-text-field :value="key" label="Field" readonly />
                </v-col>
                <v-col cols="">
                  <v-text-field :value="filters[key]" label="Value" readonly />
                </v-col>
                <v-col cols="auto">
                  <v-btn @click="removeFilter(key)" icon color="#c00000">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

              <v-form @submit.prevent="addFilter()">
                <v-row>
                  <v-col>
                    <v-select
                      :items="unusedFilters"
                      v-model="newFilterField"
                      label="New filter field"
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      label="New filter value"
                      v-model="newFilterValue"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn type="submit" :disabled="!newFilterValue" icon>
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <!-- TODO: regex -->
              <v-row align="baseline">
                <v-col cols="auto">
                  <v-switch label="Partial match" v-model="regex"></v-switch>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import DatePicker from "../components/DatePicker.vue"

export default {
  name: "QuerySettings",
  components: {
    DatePicker,
  },
  props: {
    fields: Array,
  },
  data() {
    return {
      newFilterField: null,
      newFilterValue: null,
    }
  },

  methods: {
    addFilter() {
      // this.filters = { ... this.filters, [this.newFilterField]: this.newFilterValue }
      // OR
      const query = {
        ...this.$route.query,
        [this.newFilterField]: this.newFilterValue,
      }
      this.$router.replace({ query })
      this.newFilterField = null
      this.newFilterValue = null
    },
    removeFilter(key) {
      const query = { ...this.$route.query }
      delete query[key]
      this.$router.replace({ query })
    },
  },
  computed: {
    to: {
      get() {
        return this.$route.query.to
      },
      set(newVal) {
        const query = { ...this.$route.query, to: newVal }
        if (!newVal) delete query.to
        this.$router.replace({ query })
      },
    },
    from: {
      get() {
        return this.$route.query.from
      },
      set(newVal) {
        const query = { ...this.$route.query, from: newVal }
        if (!newVal) delete query.from
        this.$router.replace({ query })
      },
    },
    regex: {
      get() {
        return this.$route.query.regex
      },
      set(newVal) {
        const query = { ...this.$route.query, regex: newVal }
        if (!newVal) delete query.regex
        this.$router.replace({ query })
      },
    },
    filters: {
      get() {
        // eslint-disable-next-line no-unused-vars
        const { to, from, sort, order, page, limit, skip, regex, ...fields } =
          this.$route.query
        return fields
      },
      set(newVal) {
        const query = { ...this.$route.query, ...newVal }
        this.$router.replace({ query })
      },
    },

    unusedFilters() {
      return ["file", ...this.fields].filter(
        (f) => !Object.keys(this.filters).includes(f)
      )
    },
  },
}
</script>
