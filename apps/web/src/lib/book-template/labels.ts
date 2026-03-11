/**
 * Section labels for the PDF template, localized by book language.
 */

interface BookLabels {
  contents: string;
  introduction: string;
  conclusion: string;
  finalConsiderations: string;
  glossary: string;
  appendix: string;
  authorsNote: string;
  chapter: string;
  allRightsReserved: string;
  generatedWith: string;
}

const labels: Record<string, BookLabels> = {
  en: {
    contents: 'Contents',
    introduction: 'Introduction',
    conclusion: 'Conclusion',
    finalConsiderations: 'Final Considerations',
    glossary: 'Glossary',
    appendix: 'Appendix',
    authorsNote: "Author's Note",
    chapter: 'CHAPTER',
    allRightsReserved: 'All rights reserved.',
    generatedWith: 'Generated with BestSellers AI',
  },
  'pt-BR': {
    contents: 'Sumário',
    introduction: 'Introdução',
    conclusion: 'Conclusão',
    finalConsiderations: 'Considerações Finais',
    glossary: 'Glossário',
    appendix: 'Apêndice',
    authorsNote: 'Nota do Autor',
    chapter: 'CAPÍTULO',
    allRightsReserved: 'Todos os direitos reservados.',
    generatedWith: 'Gerado com BestSellers AI',
  },
  es: {
    contents: 'Índice',
    introduction: 'Introducción',
    conclusion: 'Conclusión',
    finalConsiderations: 'Consideraciones Finales',
    glossary: 'Glosario',
    appendix: 'Apéndice',
    authorsNote: 'Nota del Autor',
    chapter: 'CAPÍTULO',
    allRightsReserved: 'Todos los derechos reservados.',
    generatedWith: 'Generado con BestSellers AI',
  },
};

export function getBookLabels(language?: string | null): BookLabels {
  if (language && labels[language]) return labels[language];
  // Try base language (e.g., "pt" from "pt-BR")
  if (language) {
    const base = language.split('-')[0];
    const match = Object.keys(labels).find((k) => k.startsWith(base));
    if (match) return labels[match];
  }
  return labels.en;
}
