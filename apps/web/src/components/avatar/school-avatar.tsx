'use client';

import { createAvatar } from '@dicebear/core';
import { adventurerNeutral, avataaarsNeutral, loreleiNeutral, notionistsNeutral } from '@dicebear/collection';
import { useEffect, useMemo } from 'react';

import { useUiStore } from '../../store/ui-store';

const AVATAR_STYLES = [
  { key: 'adventurerNeutral', style: adventurerNeutral },
  { key: 'avataaarsNeutral', style: avataaarsNeutral },
  { key: 'loreleiNeutral', style: loreleiNeutral },
  { key: 'notionistsNeutral', style: notionistsNeutral },
] as const;

function createSeed() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `avatar-${Math.random().toString(36).slice(2, 10)}`;
}

type SchoolAvatarProps = {
  label: string;
  size?: number;
};

export function SchoolAvatar({ label, size = 96 }: SchoolAvatarProps) {
  const { avatarSeed, avatarStyle, setAvatar } = useUiStore();

  useEffect(() => {
    if (!avatarSeed || !avatarStyle) {
      const fallback = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];

      setAvatar({
        seed: avatarSeed ?? createSeed(),
        style: avatarStyle ?? fallback.key,
      });
    }
  }, [avatarSeed, avatarStyle, setAvatar]);

  const src = useMemo(() => {
    const styleEntry = AVATAR_STYLES.find((entry) => entry.key === avatarStyle) ?? AVATAR_STYLES[0];
    const seed = avatarSeed ?? 'assess-ai-school';
    const avatar = createAvatar(styleEntry.style as any, {
      seed,
      backgroundColor: ['f7f2ed'],
      radius: 50,
      size,
    });

    return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`;
  }, [avatarSeed, avatarStyle, size]);

  return <img className="school-avatar-image" alt={label} src={src} />;
}
