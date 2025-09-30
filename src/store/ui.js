import { create } from 'zustand'

export const useUI = create((set) => ({
    loading: false,
    setLoading: (v) => set({ loading: v }),
}))
