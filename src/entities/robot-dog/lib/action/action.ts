import type { RobotDogAction, RobotDogMoodName } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * What the dog does about each mood.
 *
 * The model has four clips and the dog has five moods, so two of them share
 * one: `tired` and `sad` both read as the dog hanging its head, which
 * is the honest reading — the child should see that something is wrong
 * without the game naming which of the two it is.
 *
 * `bored` walks on purpose: a dog with nothing to do paces, and a child who
 * sees it pacing goes looking for a chore.
 */
const ACTION_FOR_MOOD: Record<RobotDogMoodName, RobotDogAction> = {
  proud: 'joy',
  content: 'idle',
  bored: 'walk',
  tired: 'sad',
  sad: 'sad',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * The clip the dog rests in, given the dog's mood.
 *
 * Before there is a profile there is no mood to read, and the choice
 * falls back to whatever the grown-up picked in settings — that switch is the
 * only thing driving the dog on a fresh profile.
 */
const actionForMood = (
  mood: RobotDogMoodName | null,
  chosen: RobotDogAction,
): RobotDogAction => (mood === null ? chosen : ACTION_FOR_MOOD[mood]);

export { actionForMood };
