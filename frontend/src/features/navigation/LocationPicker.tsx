import type { NavigationLocation } from '../../types/navigation';
import { isNearestTarget, type TargetSelection } from './navigationTargets';
import styles from './NavigationView.module.css';

type LocationPickerProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  selected: TargetSelection | null;
  results: NavigationLocation[];
  nearestTarget?: Extract<TargetSelection, { kind: 'nearest' }>;
  onQueryChange: (value: string) => void;
  onSelect: (value: TargetSelection) => void;
};

function LocationPicker({
  id,
  label,
  placeholder,
  query,
  selected,
  results,
  nearestTarget,
  onQueryChange,
  onSelect,
}: LocationPickerProps) {
  const showResults = !selected && query.trim().length > 0;
  const hasResults = results.length > 0 || Boolean(nearestTarget);

  return (
    <div className={styles.picker}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className={styles.input}
        autoComplete="off"
      />
      {selected && (
        <p className={styles.selectionText}>
          {isNearestTarget(selected)
            ? selected.meta
            : `${selected.buildingCode} - ${selected.floorLabel}`}
        </p>
      )}
      {showResults && hasResults && (
        <div className={styles.resultsBox}>
          {nearestTarget && (
            <button
              key={nearestTarget.id}
              type="button"
              className={styles.resultButton}
              onClick={() => onSelect(nearestTarget)}
            >
              <span className={styles.resultName}>{nearestTarget.displayName}</span>
              <span className={styles.resultMeta}>{nearestTarget.meta}</span>
            </button>
          )}
          {results.map((location) => (
            <button
              key={location.id}
              type="button"
              className={styles.resultButton}
              onClick={() => onSelect(location)}
            >
              <span className={styles.resultName}>{location.displayName}</span>
              <span className={styles.resultMeta}>
                {location.buildingCode} - {location.floorLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
