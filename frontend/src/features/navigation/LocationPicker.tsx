import { useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { localizeFloorLabel } from '../../utils/displayNames';
import { shouldShowSuggestions } from '../../utils/search';
import { getTargetSelectionLabel, isQueryMatchingSelection } from './locationSelection';
import { isNearestTarget, type LocationPickerSuggestion, type TargetSelection } from './navigationTargets';
import styles from './NavigationView.module.css';

type LocationPickerProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  selected: TargetSelection | null;
  suggestions: LocationPickerSuggestion[];
  onQueryChange: (value: string) => void;
  onSelect: (value: TargetSelection) => void;
};

function LocationPicker({
  id,
  label,
  placeholder,
  query,
  selected,
  suggestions,
  onQueryChange,
  onSelect,
}: LocationPickerProps) {
  const { language, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const committedLabel =
    selected && isQueryMatchingSelection(query, selected, language, t)
      ? getTargetSelectionLabel(selected, language, t)
      : null;
  const showResults = shouldShowSuggestions(query, committedLabel, suggestions.length, isFocused);

  const commitSelection = (value: TargetSelection) => {
    onSelect(value);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className={styles.picker}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 120);
        }}
        placeholder={placeholder}
        className={`${styles.input} ${committedLabel ? styles.inputSelected : ''}`}
        autoComplete="off"
      />
      {selected && committedLabel && (
        <p className={styles.selectionText}>
          {isNearestTarget(selected)
            ? t('navigation.nearestWcMeta')
            : `${selected.buildingCode} - ${localizeFloorLabel(selected.floorLabel, language)}`}
        </p>
      )}
      {showResults && (
        <div className={styles.resultsBox}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.key}
              type="button"
              className={styles.resultButton}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitSelection(suggestion.value)}
            >
              <span className={styles.resultName}>{suggestion.label}</span>
              <span className={styles.resultMeta}>{suggestion.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
