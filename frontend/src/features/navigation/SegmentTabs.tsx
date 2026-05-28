import type { RouteSegment } from '../../types/navigation';
import styles from './NavigationView.module.css';

type SegmentTabsProps = {
  segments: RouteSegment[];
  activeSegmentIndex: number;
  onSelect: (index: number) => void;
};

function SegmentTabs({ segments, activeSegmentIndex, onSelect }: SegmentTabsProps) {
  return (
    <div className={styles.segmentTabs}>
      {segments.map((segment, index) => (
        <button
          key={`${segment.floorId}-${index}`}
          type="button"
          className={`${styles.segmentTab} ${activeSegmentIndex === index ? styles.segmentTabActive : ''}`}
          onClick={() => onSelect(index)}
        >
          {segment.floorLabel}
        </button>
      ))}
    </div>
  );
}

export default SegmentTabs;
