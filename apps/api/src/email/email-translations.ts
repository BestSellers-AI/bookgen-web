const translations: Record<string, {
  greeting: (name?: string) => string;
  resetSubject: string;
  resetBody: string;
  resetButton: string;
  resetExpiry: string;
  resetIgnore: string;
  welcomeSubject: string;
  welcomeBody: (name: string) => string;
  welcomeButton: string;
  welcomeHelp: string;
  bookSubject: (title: string) => string;
  bookBody: (title: string) => string;
  bookButton: string;
  bookHelp: string;
  footer: string;
}> = {
  en: {
    greeting: (name?: string) => name ? `Hi ${name},` : 'Hi,',
    resetSubject: 'Reset your password — BestSellers AI',
    resetBody: 'We received a request to reset your password. Click the button below to choose a new password.',
    resetButton: 'Reset Password',
    resetExpiry: 'This link will expire in <strong>1 hour</strong>.',
    resetIgnore: "If you didn't request a password reset, you can safely ignore this email.",
    welcomeSubject: 'Welcome to BestSellers AI!',
    welcomeBody: (name: string) =>
      `Welcome to <strong>BestSellers AI</strong>! Your account has been created and you're all set to start generating amazing books with AI.`,
    welcomeButton: 'Go to Dashboard',
    welcomeHelp: 'If you have any questions, feel free to reach out to our support team.',
    bookSubject: (title: string) => `Your book "${title}" is ready! — BestSellers AI`,
    bookBody: (title: string) =>
      `Great news! Your book <strong>"${title}"</strong> has been fully generated and is ready for you to review.`,
    bookButton: 'View Your Book',
    bookHelp: 'You can access all your books from your dashboard at any time.',
    footer: 'All rights reserved.',
  },
  'pt-BR': {
    greeting: (name?: string) => name ? `Oi ${name},` : 'Oi,',
    resetSubject: 'Redefinir sua senha — BestSellers AI',
    resetBody: 'Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para escolher uma nova senha.',
    resetButton: 'Redefinir Senha',
    resetExpiry: 'Este link expira em <strong>1 hora</strong>.',
    resetIgnore: 'Se voce nao solicitou a redefinicao de senha, pode ignorar este email com seguranca.',
    welcomeSubject: 'Bem-vindo ao BestSellers AI!',
    welcomeBody: (name: string) =>
      `Bem-vindo ao <strong>BestSellers AI</strong>! Sua conta foi criada e voce esta pronto para comecar a gerar livros incriveis com IA.`,
    welcomeButton: 'Ir para o Painel',
    welcomeHelp: 'Se tiver alguma duvida, entre em contato com nossa equipe de suporte.',
    bookSubject: (title: string) => `Seu livro "${title}" esta pronto! — BestSellers AI`,
    bookBody: (title: string) =>
      `Otimas noticias! Seu livro <strong>"${title}"</strong> foi totalmente gerado e esta pronto para revisao.`,
    bookButton: 'Ver Seu Livro',
    bookHelp: 'Voce pode acessar todos os seus livros no painel a qualquer momento.',
    footer: 'Todos os direitos reservados.',
  },
  es: {
    greeting: (name?: string) => name ? `Hola ${name},` : 'Hola,',
    resetSubject: 'Restablecer tu contrasena — BestSellers AI',
    resetBody: 'Recibimos una solicitud para restablecer tu contrasena. Haz clic en el boton de abajo para elegir una nueva contrasena.',
    resetButton: 'Restablecer Contrasena',
    resetExpiry: 'Este enlace expirara en <strong>1 hora</strong>.',
    resetIgnore: 'Si no solicitaste un restablecimiento de contrasena, puedes ignorar este correo con seguridad.',
    welcomeSubject: 'Bienvenido a BestSellers AI!',
    welcomeBody: (name: string) =>
      `Bienvenido a <strong>BestSellers AI</strong>! Tu cuenta ha sido creada y estas listo para empezar a generar libros increibles con IA.`,
    welcomeButton: 'Ir al Panel',
    welcomeHelp: 'Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.',
    bookSubject: (title: string) => `Tu libro "${title}" esta listo! — BestSellers AI`,
    bookBody: (title: string) =>
      `Excelentes noticias! Tu libro <strong>"${title}"</strong> ha sido completamente generado y esta listo para que lo revises.`,
    bookButton: 'Ver Tu Libro',
    bookHelp: 'Puedes acceder a todos tus libros desde tu panel en cualquier momento.',
    footer: 'Todos los derechos reservados.',
  },
};

export function getTranslations(locale: string) {
  return translations[locale] ?? translations.en;
}
