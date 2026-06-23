import { create } from 'zustand'

/**
 * Global drawer open/close state. Lifted out of AppShell so the single
 * <AppDrawer /> mounted at the App root can be controlled from anywhere
 * (hamburger in any AppShell, programmatic open from empty states, deep
 * links). One Radix portal for the whole app — no per-route remount.
 */
interface DrawerState {
  open: boolean
  setOpen(open: boolean): void
  toggle(): void
}

export const useDrawerStore = create<DrawerState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}))
