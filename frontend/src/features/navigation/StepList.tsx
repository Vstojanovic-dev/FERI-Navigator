import type { RouteSegment } from '../../types/navigation';
import styles from './NavigationView.module.css';

type StepListProps = {
  segment: RouteSegment;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
};

function StepList({ segment, activeStepIndex, onSelectStep }: StepListProps) {
  return (
    <div className={styles.stepsBox}>
      {segment.steps.map((step, index) => (
        <button
          key={`${step.fromNodeId}-${step.toNodeId}-${index}`}
          type="button"
          className={`${styles.stepButton} ${activeStepIndex === index ? styles.stepButtonActive : ''}`}
          onClick={() => onSelectStep(index)}
        >
          <span className={styles.stepNumber}>{index + 1}</span>
          <span className={styles.stepText}>{step.text}</span>
        </button>
      ))}
    </div>
  );
}

export default StepList;
