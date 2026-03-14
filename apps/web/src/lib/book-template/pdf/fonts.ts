import { Font } from '@react-pdf/renderer';

export function registerFonts() {
  // Lora — modern serif for body text (replaces Times-Roman)
  Font.register({
    family: 'Lora',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJG.ttf' },
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJG.ttf', fontWeight: 700 },
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFkqg.ttf', fontStyle: 'italic' },
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-C0Ckqg.ttf', fontWeight: 700, fontStyle: 'italic' },
    ],
  });

  // Inter — clean sans-serif for headings (replaces Helvetica)
  Font.register({
    family: 'Inter',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf' },
      { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 700 },
    ],
  });

  // Disable hyphenation for performance
  Font.registerHyphenationCallback((word) => [word]);
}
