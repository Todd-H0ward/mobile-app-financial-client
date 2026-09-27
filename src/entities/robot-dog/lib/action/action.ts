import type { RobotDogAction, RobotDogMoodName } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** What the dog does about each mood. */
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

/** The clip the dog rests in, given the dog's mood. */
const actionForMood = (
  mood: RobotDogMoodName | null,
  chosen: RobotDogAction,
): RobotDogAction => (mood === null ? chosen : ACTION_FOR_MOOD[mood]);

export { actionForMood };
