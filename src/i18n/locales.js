// English, Telugu, and Hindi static UI localization messages
export const localeOptions = [
  { code: 'en', label: 'English', reviewed: true },
  { code: 'te', label: 'తెలుగు (Telugu)', reviewed: true },
  { code: 'hi', label: 'हिंदी (Hindi)', reviewed: true }
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
  },
  te: {
    overview: 'సారాంశం',
    community: 'కమిటీ & సేవకులు',
    money: 'ఆదాయ & వ్యయాలు',
    schedule: 'కార్యక్రమాలు',
    recognition: 'పురస్కారాలు & పోల్',
    memories: 'జ్ఞాపకాలు & ఫోటోలు',
    music: 'భక్తి గీతాలు',
    help: 'సహాయం (AI)',
    settings: 'సెట్టింగ్‌లు',
    footer: 'మన గ్రామం కోసం భక్తిశ్రద్ధలతో నిర్మించబడింది. 🪔',
    admin_unlocked: 'అడ్మిన్ అన్‌లాక్ అయింది',
    admin_sign_in: 'అడ్మిన్ లాగిన్',
    sign_out: 'లాగౌట్'
  },
  hi: {
    overview: 'मुख्य पृष्ठ',
    community: 'समिति व सेवादार',
    money: 'आय-व्यय व चंदा',
    schedule: 'कार्यक्रम सारणी',
    recognition: 'सम्मान व वोटिंग',
    memories: 'यादें व गैलरी',
    music: 'भक्ति संगीत',
    help: 'सहायता (AI)',
    settings: 'सेटिंग्स',
    footer: 'हमारे गांव और समाज के लिए श्रद्धापूर्वक समर्पित। 🪔',
    admin_unlocked: 'व्यवस्थापक अनलॉक',
    admin_sign_in: 'व्यवस्थापक लॉगिन',
    sign_out: 'लॉग आउट'
  }
}

export const translate = (locale, key) =>
  messages[locale]?.[key] || messages.en[key] || key
