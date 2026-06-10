import { useMemo } from 'react';
import { useI18n } from '../../i18n/useI18n';
import type { RouteSegment } from '../../types/navigation';
import { getRouteStepLabel } from '../../utils/navigationLocalization';
import styles from './NavigationView.module.css';

type StepListProps = {
  segment: RouteSegment;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  windowStart?: number;
  windowSize?: number;
  reserveEmptySlots?: boolean;
};

const iconByManeuver: Record<string, string> = {
  straight: '↑',
  slight_left: '↖',
  left: '←',
  slight_right: '↗',
  right: '→',
  turn_back: '↺',
  stairs_up: '⇡',
  stairs_down: '⇣',
  elevator: '🛗',
  elevator_exit: '⇢',
  enter: '↪',
  destination: '●',
  building_transfer: '⇄',
};

const STEP_SLOT_COUNT = 4;

function StepList({
  segment,
  activeStepIndex,
  onSelectStep,
  windowStart,
  windowSize = STEP_SLOT_COUNT,
  reserveEmptySlots = false,
}: StepListProps) {
  const { language } = useI18n();
  const start = Math.max(0, windowStart ?? 0);
  const size = Math.min(STEP_SLOT_COUNT, Math.max(1, windowSize));
  const end = Math.min(segment.steps.length, start + size);

  const visibleSteps = useMemo(
    () =>
      segment.steps.slice(start, end).map((step, offset) => ({
        step,
        index: start + offset,
        label: getRouteStepLabel(step, language),
      })),
    [end, language, segment.steps, start]
  );

  const placeholderCount = reserveEmptySlots
    ? Math.max(0, STEP_SLOT_COUNT - visibleSteps.length)
    : 0;

  return (
    <div className={styles.stepsBox}>
      {visibleSteps.map(({ step, index, label }) => (
        <button
          key={`${step.fromNodeId}-${step.toNodeId}-${index}-${language}`}
          type="button"
          className={`${styles.stepButton} ${activeStepIndex === index ? styles.stepButtonActive : ''}`}
          onClick={() => onSelectStep(index)}
        >
          <span className={styles.stepIcon} aria-hidden="true">
            {iconByManeuver[step.icon] ?? iconByManeuver[step.maneuverType] ?? '↑'}
          </span>
          <span className={styles.stepText}>{label}</span>
        </button>
      ))}
      {Array.from({ length: placeholderCount }, (_, slot) => (
        <div
          key={`placeholder-${start}-${slot}`}
          className={styles.stepPlaceholder}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default StepList;
