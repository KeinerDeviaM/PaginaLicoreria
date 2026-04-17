import './SearchInput.css'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar productos...'
}) {
  return (
    <div className="search-input-wrapper">
      <span className="search-input-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </span>

      <input
        type="text"
        className="search-input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {value?.trim() && (
        <button
          type="button"
          className="search-input-clear"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </div>
  )
}
