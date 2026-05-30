import type { RouteSegment } from '../../types/navigation';
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
  const start = Math.max(0, windowStart ?? 0);
  const size = Math.min(STEP_SLOT_COUNT, Math.max(1, windowSize));
  const end = Math.min(segment.steps.length, start + size);
  const visibleSteps = segment.steps.slice(start, end);
  const placeholderCount = reserveEmptySlots
    ? Math.max(0, STEP_SLOT_COUNT - visibleSteps.length)
    : 0;

  return (
    <div className={styles.stepsBox}>
      {visibleSteps.map((step, offset) => {
        const index = start + offset;
        return (
          <button
            key={`${step.fromNodeId}-${step.toNodeId}-${index}`}
            type="button"
            className={`${styles.stepButton} ${activeStepIndex === index ? styles.stepButtonActive : ''}`}
            onClick={() => onSelectStep(index)}
          >
            <span className={styles.stepIcon} aria-hidden="true">
              {iconByManeuver[step.icon] ?? iconByManeuver[step.maneuverType] ?? '↑'}
            </span>
            <span className={styles.stepText}>{step.text}</span>
          </button>
        );
      })}
      {Array.from({ length: placeholderCount }, (_, slot) => (
        <div key={`placeholder-${start}-${slot}`} className={styles.stepPlaceholder} aria-hidden="true" />
      ))}
    </div>
  );
}

export default StepList;
