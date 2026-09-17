import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  getTraitById,
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

interface PetCreateController {
  species: PetSpecies;
  color: PetColor;
  pattern: PetPattern;
  /** Chosen trait id, or `null` until the child picks one. */
  traitId: string | null;
  /** What the child typed, unnormalized — the field shows it back verbatim. */
  name: string;
  canFinish: boolean;
  /** Nothing is written to the save until `finish`. */
  setSpecies: (species: PetSpecies) => void;
  setColor: (color: PetColor) => void;
  setPattern: (pattern: PetPattern) => void;
  setTraitId: (traitId: string) => void;
  setName: (name: string) => void;
  /** Writes the look, trait and name into the save and goes back to the room. */
  finish: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Choosing the pet: three axes, one trait and a name.
 *
 * Nothing reaches the save until the last button. The look the child is
 * turning over is preview state, and a child who backs out of the screen finds
 * the box still closed rather than a half-chosen animal.
 *
 * The appearance axes never change again afterwards (`PetSave`), which is why
 * the pet's name is what marks the meeting as done: an unnamed pet is a pet
 * still in its box. The trait is fixed here too — it shifts prices and need
 * speeds for the whole run (docs/pet.md).
 */
export const usePetCreate = (): PetCreateController => {
  const router = useRouter();
  const updateUser = useUpdateUser();
  const pet = useUserPet();

  const [species, setSpecies] = useState<PetSpecies>(pet?.species ?? 'cat');
  const [color, setColor] = useState<PetColor>(pet?.color ?? 'sand');
  const [pattern, setPattern] = useState<PetPattern>(pet?.pattern ?? 'solid');
  const [traitId, setTraitId] = useState<string | null>(
    pet?.traitIds[0] ?? null,
  );
  const [name, setName] = useState(pet?.name ?? '');

  const hasTrait = traitId != null && getTraitById(traitId) != null;

  return {
    species,
    color,
    pattern,
    traitId,
    name,
    canFinish: isPetNameValid(name) && hasTrait,
    setSpecies,
    setColor,
    setPattern,
    setTraitId,
    setName,

    finish: () => {
      if (!isPetNameValid(name) || !hasTrait || traitId == null) return;

      updateUser((user) => ({
        ...user,
        pet: {
          ...user.pet,
          species,
          color,
          pattern,
          traitIds: [traitId],
          name: normalizePetName(name),
        },
      }));

      hapticSuccess();
      router.back();
    },
  };
};

export type { PetCreateController };
