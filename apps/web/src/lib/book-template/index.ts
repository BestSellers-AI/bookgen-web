export { BookDocument } from './pdf/book-document';
export { registerFonts } from './pdf/fonts';
export { toRenderableBook } from './adapt';
export { getBookLabels } from './labels';
export { proxyImageToBase64, proxyBookImages } from './image-proxy';
export { downloadBookPdf, downloadBookDocx } from './download';
export { generateBookDocx } from './docx/book-document-docx';
export type { RenderableBook, RenderableChapter } from './types';
