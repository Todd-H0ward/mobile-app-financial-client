import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  isPetNameValid,
  normalizePetName,
  type PetColor,
  type PetPattern,
  type PetSpecies,
} from '@/entities/pet';
import { useUpdateUser, useUserPet } from '@/entities/user';

import { hapticSuccess } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Everything the meeting screen reads and calls. */
interface PetCreateController {
  /** Species being previewed. */
  species: PetSpecies;
  /** Coat being previewed. */
  color: PetColor;
  /** Pattern being previewed. */
  pattern: PetPattern;
  /** What the child typed, unnormalized — the field shows it back verbatim. */
  name: string;
  /** Whether the bottom button is live. */
  canFinish: boolean;
  /** Picks a species. Nothing is written to the save until `finish`. */
  setSpecies: (species: PetSpecies) => void;
  /** Picks a coat. */
  setColor: (color: PetColor) => void;
  /** Picks a pattern. */
  setPattern: (pattern: PetPattern) => void;
  /** Types into the name field. */
  setName: (name: string) => void;
  /** Writes the look and the name into the save and goes back to the room. */
  finish: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Choosing the pet: three axes and a name.
 *
 * Nothing reaches the save until the last button. The look the child is
 * turning over is preview state, and a child who backs out of the screen finds
 * the box still closed rather than a half-chosen animal.
 *
 * The appearance axes never change again afterwards (`PetSave`), which is why
 * the pet's name is what marks the meeting as done: an unnamed pet is a pet
 * still in its box.
 */
export const usePetCreate = (): PetCreateController => {
  const router = useRouter();
  const updateUser = useUpdateUser();
  const pet = useUserPet();

  const [species, setSpecies] = useState<PetSpecies>(pet?.species ?? 'cat');
  const [color, setColor] = useState<PetColor>(pet?.color ?? 'sand');
  const [pattern, setPattern] = useState<PetPattern>(pet?.pattern ?? 'solid');
  const [name, setName] = useState(pet?.name ?? '');

  return {
    species,
    color,
    pattern,
    name,
    canFinish: isPetNameValid(name),
    setSpecies,
    setColor,
    setPattern,
    setName,

    finish: () => {
      if (!isPetNameValid(name)) return;

      updateUser((user) => ({
        ...user,
        pet: {
          ...user.pet,
          species,
          color,
          pattern,
          name: normalizePetName(name),
        },
      }));

      hapticSuccess();
      router.back();
    },
  };
};

export type { PetCreateController };
