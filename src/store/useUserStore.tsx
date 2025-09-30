import { create } from "zustand";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  password: string; 
  age:number;
};

type UserState = {
  user: User | null;
  dark: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setDark: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  dark: false,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setDark: () => set((state) => ({ dark: !state.dark })),
}));
