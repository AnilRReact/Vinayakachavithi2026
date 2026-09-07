// Static UI localization messages (Default English)
export const localeOptions = [
  { code: 'en', label: 'English', reviewed: true }
]

export const messages = {
  en: {
    overview: 'Overview',
    community: 'Community',
    money: 'Money',
    schedule: 'Schedule',
    recognition: 'Recognition',
    memories: 'Memories',
    music: 'Music',
    help: 'Help',
    settings: 'Settings',
    footer: 'Built with devotion for our village celebration. 🪔',
    admin_unlocked: 'Admin Unlocked',
    admin_sign_in: 'Admin sign in',
    sign_out: 'Sign out'
  }
}

export const translate = (locale, key) =>
  messages.en[key] || key
