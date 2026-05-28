import { defineStore } from 'pinia'

export interface User {
    _id?: string
    properties?: { _id?: string }
}

export const useAppStore = defineStore('app', {
    state: () => ({
        current_user: null as User | null,
    }),
    actions: {
        set_current_user(user: User | null) {
            this.current_user = user
        },
    },
})
