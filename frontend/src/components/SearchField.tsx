import styles from './SearchField.module.css';

type SearchFieldProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  id?: string;
};

function SearchField({ value, placeholder, onChange, id }: SearchFieldProps) {
  return (
    <div className={styles.searchBox}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.2-4.2" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}

export default SearchField;
