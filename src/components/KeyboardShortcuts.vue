<template>
  <v-dialog
    v-model="help_dialog"
    width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        icon
        v-bind="attrs"
        v-on="on">
        <v-icon>mdi-information</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        Help
      </v-card-title>


      <v-card-text>
        <v-list
          dense>
          <v-list-item
            v-for="(shortcut, i) in shortcuts"
            :key="i">

            <v-list-item-content>
              <v-list-item-title class="py-2">
                <span class="shortcut">{{shortcut.key}}</span>
              </v-list-item-title>
            </v-list-item-content>

            <v-list-item-content>
              <v-list-item-title class="py-2">
                <span>{{shortcut.action}}</span>
              </v-list-item-title>
            </v-list-item-content>

          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="help_dialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'KeyboardShortcuts',
  data(){
    return {
      help_dialog: false,
      shortcuts: [
        {key: 'Ctrl + S', action: 'Save'},
        {key: 'Ctrl + A', action: 'Set OK label for current item'},
        {key: 'Ctrl + Z', action: 'Remove last polygon point'},
        {key: 'Del', action: 'Delete selected point / annotation'},
        {key: '←', action: 'Previous item'},
        {key: '→', action: 'Next item'},
      ]
    }
  }
}
</script>

<style scoped>
.shortcut {
  border: 1px solid #dddddd;
  border-radius: 0.5em;
  padding: 0.5em;
}
</style>
