import { Font } from '@react-pdf/renderer';

export function registerFonts() {
  // Disable hyphenation for performance
  Font.registerHyphenationCallback((word) => [word]);
}
