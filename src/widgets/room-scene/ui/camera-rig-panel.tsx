import { useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Slider, Text } from '@/shared/ui';

import {
  CAMERA_TUNE_RANGE,
  type CameraTune,
  formatCameraTune,
} from '../model/camera-tune';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CameraRigPanelProps {
  tune: CameraTune;
  onTuneChange: (tune: CameraTune) => void;
  /** Live orbit from the GL loop — for the readout only. */
  live: {
    azimuth: number;
    elevation: number;
    distance: number;
    /** Frames the GL loop actually drew in the last sample. */
    fps: number;
  };
}

interface TuneRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits?: number;
  onChange: (value: number) => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const TuneRow = ({
  label,
  value,
  min,
  max,
  step,
  digits = 0,
  onChange,
}: TuneRowProps) => {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text variant="label" themeColor="textSecondary">
          {label}
        </Text>
        <Text variant="label" themeColor="text">
          {value.toFixed(digits)}
        </Text>
      </View>
      <Slider
        accessibilityLabel={label}
        value={value}
        min={min}
        max={max}
        step={step}
        color="primary"
        isThumbFilled
        onChange={onChange}
        style={styles.slider}
      />
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Dev framing desk: dial the camera constants, read the live orbit, paste
 * the dump into `entities/scene/model/camera.ts` when it looks right.
 */
const CameraRigPanel = ({ tune, onTuneChange, live }: CameraRigPanelProps) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(true);

  const set = (key: keyof CameraTune) => (value: number) => {
    onTuneChange({ ...tune, [key]: value });
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Camera rig"
        onPress={() => setIsOpen((open) => !open)}
        style={styles.header}
      >
        <Text variant="label" themeColor="text">
          Camera rig {isOpen ? '▾' : '▸'}
        </Text>
        <Text variant="label" themeColor="textMuted">
          az {live.azimuth.toFixed(1)} · el {live.elevation.toFixed(1)} · d{' '}
          {live.distance.toFixed(0)} · {live.fps.toFixed(0)} fps
        </Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.body}>
          <TuneRow
            label="ROOM_ELEVATION"
            value={tune.roomElevation}
            digits={0}
            onChange={set('roomElevation')}
            {...CAMERA_TUNE_RANGE.roomElevation}
          />
          <TuneRow
            label="TOP_ELEVATION"
            value={tune.topElevation}
            digits={0}
            onChange={set('topElevation')}
            {...CAMERA_TUNE_RANGE.topElevation}
          />
          <TuneRow
            label="ROOM_FIT"
            value={tune.roomFit}
            digits={2}
            onChange={set('roomFit')}
            {...CAMERA_TUNE_RANGE.roomFit}
          />
          <TuneRow
            label="TOP_FIT"
            value={tune.topFit}
            digits={2}
            onChange={set('topFit')}
            {...CAMERA_TUNE_RANGE.topFit}
          />
          <TuneRow
            label="SCENE_PLATFORM_Y"
            value={tune.platformY}
            digits={0}
            onChange={set('platformY')}
            {...CAMERA_TUNE_RANGE.platformY}
          />
          <TuneRow
            label="CAMERA_FOV"
            value={tune.fov}
            digits={0}
            onChange={set('fov')}
            {...CAMERA_TUNE_RANGE.fov}
          />
          <Text variant="small" themeColor="textMuted" style={styles.dump}>
            {formatCameraTune(tune)}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    gap: SPACING.one,
    paddingBottom: SPACING.two,
    paddingHorizontal: SPACING.two,
  },
  dump: {
    fontFamily: 'monospace',
    marginTop: SPACING.one,
  },
  header: {
    gap: 2,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.two,
  },
  root: {
    alignSelf: 'stretch',
    borderRadius: RADII.m,
    borderWidth: 1,
    maxWidth: 360,
    overflow: 'hidden',
  },
  row: {
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slider: {
    height: 28,
    width: '100%',
  },
});

export type { CameraRigPanelProps };
export { CameraRigPanel };
