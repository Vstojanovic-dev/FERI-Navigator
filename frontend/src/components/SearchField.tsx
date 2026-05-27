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
      <span className={styles.icon}>⌕</span>
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
