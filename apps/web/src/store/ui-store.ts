import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AvatarState = {
  avatarSeed: string | null;
  avatarStyle: string | null;
  setAvatar: (avatar: { seed: string; style: string }) => void;
};

export const useUiStore = create<AvatarState>()(
  persist(
    (set) => ({
      avatarSeed: null,
      avatarStyle: null,
      setAvatar: ({ seed, style }) =>
        set({
          avatarSeed: seed,
          avatarStyle: style,
        }),
    }),
    {
      name: 'assess-ai-ui-store',
    },
  ),
);
