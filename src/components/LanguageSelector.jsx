import { localeOptions } from '../i18n/locales'

export function LanguageSelector({ locale, onChange }) {
  return (
    <div className="language-selector-wrap" title="Change display language">
      <span className="lang-icon" aria-hidden="true">🌐</span>
      <select
        className="lang-select"
        value={locale}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select interface language"
      >
        {localeOptions.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}
