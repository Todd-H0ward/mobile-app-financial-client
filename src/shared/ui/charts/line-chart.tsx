import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text } from '../text';

import {
  CHART_HEIGHT,
  CHART_WIDTH,
  type ChartSeries,
  chartArea,
  chartCeiling,
  chartLength,
  chartLine,
  chartPoint,
  PADDING_BOTTOM,
  PADDING_LEFT,
  PADDING_RIGHT,
  PADDING_TOP,
} from './chart';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LineChartProps {
  /** One line per series. Values are oldest first. */
  series: ChartSeries[];
  /** Tick under each point — a period number, a day. Same length as the data. */
  labels?: string[];
  /** Read out instead of the drawing, which a screen reader cannot see. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const STROKE_WIDTH = 2.5;
const DOT_RADIUS = 3.5;

/** Horizontal guides, including the baseline — enough to read a level by. */
const GUIDE_COUNT = 3;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * A line chart: one or more series over the same ticks.
 *
 * Drawn here rather than pulled from a charting library so it speaks the
 * project's own language — colours come from `useTheme`, spacing from
 * `SPACING`, and there is no second styling system to reconcile.
 *
 * The area under each line is tinted: on a phone the eye reads area faster
 * than it reads slope, and the tint is what makes a four-point trend legible
 * at a glance rather than something to squint at.
 */
export const LineChart = ({
  series,
  labels = [],
  accessibilityLabel,
  style,
}: LineChartProps) => {
  const theme = useTheme();

  const ceiling = chartCeiling(series);
  const count = chartLength(series);

  const guides = Array.from({ length: GUIDE_COUNT }, (_, index) => {
    const share = index / (GUIDE_COUNT - 1);
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    return {
      y: PADDING_TOP + plotHeight * share,
      value: Math.round(ceiling * (1 - share)),
    };
  });

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.root, style]}
    >
      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        {guides.map((guide) => (
          <Line
            key={guide.y}
            x1={PADDING_LEFT}
            y1={guide.y}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y2={guide.y}
            stroke={theme.border}
            strokeWidth={1}
          />
        ))}

        {series.map((one) => {
          const points = one.values.map((value, index) =>
            chartPoint(value, index, count, ceiling),
          );

          return (
            <Path
              key={`${one.color}:area`}
              d={chartArea(points)}
              fill={theme[one.color]}
              opacity={0.14}
            />
          );
        })}

        {series.map((one) => {
          const points = one.values.map((value, index) =>
            chartPoint(value, index, count, ceiling),
          );

          return (
            <Path
              key={`${one.color}:line`}
              d={chartLine(points)}
              stroke={theme[one.color]}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}

        {series.flatMap((one) =>
          one.values.map((value, index) => {
            const point = chartPoint(value, index, count, ceiling);

            return (
              <Circle
                key={`${one.color}:${index}`}
                cx={point.x}
                cy={point.y}
                r={DOT_RADIUS}
                fill={theme[one.color]}
                // The ring lifts a dot off the line it sits on, so a reading
                // stays findable where two series cross.
                stroke={theme.surface}
                strokeWidth={1.5}
              />
            );
          }),
        )}
      </Svg>

      {/* The scale and the ticks are Text rather than SVG glyphs: they follow
          the app's font and scale with the reader's own type size. */}
      <View pointerEvents="none" style={styles.scale}>
        {guides.map((guide) => (
          <Text key={guide.value} variant="label" themeColor="textMuted">
            {guide.value}
          </Text>
        ))}
      </View>

      {labels.length > 0 && (
        <View style={styles.ticks}>
          {labels.map((label) => (
            <Text key={label} variant="label" themeColor="textMuted">
              {label}
            </Text>
          ))}
        </View>
      )}

      {series.some((one) => one.label) && (
        <View style={styles.legend}>
          {series.map(
            (one) =>
              one.label && (
                <View key={one.label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: theme[one.color] },
                    ]}
                  />
                  <Text variant="small" themeColor="textSecondary">
                    {one.label}
                  </Text>
                </View>
              ),
          )}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.one,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.three,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.half,
  },
  scale: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: PADDING_BOTTOM,
    paddingTop: PADDING_TOP - 6,
    position: 'absolute',
    top: 0,
  },
  swatch: {
    borderRadius: RADII.xs,
    height: 10,
    width: 10,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: PADDING_LEFT,
    paddingRight: PADDING_RIGHT,
  },
});

export type { LineChartProps };
