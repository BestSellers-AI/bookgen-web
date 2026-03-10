export interface CountryPhone {
  code: string;
  flag: string;
  name: string;
  dial: string;
  mask: string;
  maxDigits: number;
}

export const COUNTRIES: CountryPhone[] = [
  // LATAM
  { code: 'BR', flag: '\u{1F1E7}\u{1F1F7}', name: 'Brasil', dial: '+55', mask: '(##) #####-####', maxDigits: 11 },
  { code: 'MX', flag: '\u{1F1F2}\u{1F1FD}', name: 'México', dial: '+52', mask: '## #### ####', maxDigits: 10 },
  { code: 'AR', flag: '\u{1F1E6}\u{1F1F7}', name: 'Argentina', dial: '+54', mask: '## ####-####', maxDigits: 10 },
  { code: 'CO', flag: '\u{1F1E8}\u{1F1F4}', name: 'Colombia', dial: '+57', mask: '### ###-####', maxDigits: 10 },
  { code: 'CL', flag: '\u{1F1E8}\u{1F1F1}', name: 'Chile', dial: '+56', mask: '# ####-####', maxDigits: 9 },
  { code: 'PE', flag: '\u{1F1F5}\u{1F1EA}', name: 'Perú', dial: '+51', mask: '### ###-###', maxDigits: 9 },
  { code: 'EC', flag: '\u{1F1EA}\u{1F1E8}', name: 'Ecuador', dial: '+593', mask: '## ###-####', maxDigits: 9 },
  { code: 'VE', flag: '\u{1F1FB}\u{1F1EA}', name: 'Venezuela', dial: '+58', mask: '###-###-####', maxDigits: 10 },
  { code: 'UY', flag: '\u{1F1FA}\u{1F1FE}', name: 'Uruguay', dial: '+598', mask: '## ###-###', maxDigits: 8 },
  { code: 'PY', flag: '\u{1F1F5}\u{1F1FE}', name: 'Paraguay', dial: '+595', mask: '### ###-###', maxDigits: 9 },
  { code: 'BO', flag: '\u{1F1E7}\u{1F1F4}', name: 'Bolivia', dial: '+591', mask: '########', maxDigits: 8 },
  { code: 'CR', flag: '\u{1F1E8}\u{1F1F7}', name: 'Costa Rica', dial: '+506', mask: '####-####', maxDigits: 8 },
  { code: 'PA', flag: '\u{1F1F5}\u{1F1E6}', name: 'Panamá', dial: '+507', mask: '####-####', maxDigits: 8 },
  { code: 'DO', flag: '\u{1F1E9}\u{1F1F4}', name: 'Rep. Dominicana', dial: '+1', mask: '(###) ###-####', maxDigits: 10 },
  { code: 'GT', flag: '\u{1F1EC}\u{1F1F9}', name: 'Guatemala', dial: '+502', mask: '####-####', maxDigits: 8 },
  { code: 'HN', flag: '\u{1F1ED}\u{1F1F3}', name: 'Honduras', dial: '+504', mask: '####-####', maxDigits: 8 },
  { code: 'SV', flag: '\u{1F1F8}\u{1F1FB}', name: 'El Salvador', dial: '+503', mask: '####-####', maxDigits: 8 },
  { code: 'NI', flag: '\u{1F1F3}\u{1F1EE}', name: 'Nicaragua', dial: '+505', mask: '####-####', maxDigits: 8 },
  { code: 'CU', flag: '\u{1F1E8}\u{1F1FA}', name: 'Cuba', dial: '+53', mask: '# ###-####', maxDigits: 8 },
  { code: 'PR', flag: '\u{1F1F5}\u{1F1F7}', name: 'Puerto Rico', dial: '+1', mask: '(###) ###-####', maxDigits: 10 },
  // North America
  { code: 'US', flag: '\u{1F1FA}\u{1F1F8}', name: 'United States', dial: '+1', mask: '(###) ###-####', maxDigits: 10 },
  { code: 'CA', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', dial: '+1', mask: '(###) ###-####', maxDigits: 10 },
  // Europe
  { code: 'PT', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugal', dial: '+351', mask: '### ### ###', maxDigits: 9 },
  { code: 'ES', flag: '\u{1F1EA}\u{1F1F8}', name: 'España', dial: '+34', mask: '### ## ## ##', maxDigits: 9 },
  { code: 'GB', flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom', dial: '+44', mask: '#### ######', maxDigits: 10 },
  { code: 'DE', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutschland', dial: '+49', mask: '#### #######', maxDigits: 11 },
  { code: 'FR', flag: '\u{1F1EB}\u{1F1F7}', name: 'France', dial: '+33', mask: '# ## ## ## ##', maxDigits: 9 },
  { code: 'IT', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italia', dial: '+39', mask: '### ### ####', maxDigits: 10 },
];

const LOCALE_DEFAULT: Record<string, string> = {
  'pt-BR': 'BR',
  es: 'MX',
  en: 'US',
};

export function getDefaultCountry(locale: string): CountryPhone {
  const code = LOCALE_DEFAULT[locale] ?? 'US';
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function applyMask(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (const ch of mask) {
    if (di >= digits.length) break;
    if (ch === '#') {
      result += digits[di++];
    } else {
      result += ch;
    }
  }
  return result;
}
