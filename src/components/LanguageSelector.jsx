import { localeOptions } from '../i18n/locales'

export function LanguageSelector({ locale, onChange }) {
  return (
    <label className="language-selector" title="Change display language">
      <span className="lang-icon" aria-hidden="true">🌐</span>
      <select
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
    </label>
  )
}
