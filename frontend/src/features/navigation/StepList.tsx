import type { RouteSegment } from '../../types/navigation';
import styles from './NavigationView.module.css';

type StepListProps = {
  segment: RouteSegment;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  windowStart?: number;
  windowSize?: number;
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

function StepList({
  segment,
  activeStepIndex,
  onSelectStep,
  windowStart,
  windowSize,
}: StepListProps) {
  const start = Math.max(0, windowStart ?? 0);
  const size = Math.max(1, windowSize ?? segment.steps.length);
  const end = Math.min(segment.steps.length, start + size);
  const visibleSteps = segment.steps.slice(start, end);

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
    </div>
  );
}

export default StepList;
