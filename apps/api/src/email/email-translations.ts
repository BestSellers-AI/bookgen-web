export interface EmailTranslations {
  greeting: (name?: string) => string;
  footer: string;
  // Password reset
  resetSubject: string;
  resetBody: string;
  resetButton: string;
  resetExpiry: string;
  resetIgnore: string;
  // Welcome
  welcomeSubject: string;
  welcomeBody: (name: string) => string;
  welcomeButton: string;
  welcomeHelp: string;
  // Welcome + set password
  welcomeSetPasswordSubject: string;
  welcomeSetPasswordBody: string;
  welcomeSetPasswordButton: string;
  welcomeSetPasswordExpiry: string;
  // Book generated + upsell
  bookSubject: (title: string) => string;
  bookBody: (title: string) => string;
  bookButton: string;
  bookNextSteps: string;
  bookUpsellCover: string;
  bookUpsellImages: string;
  bookUpsellTranslation: string;
  bookUpsellAudiobook: string;
  bookUpsellPublish: string;
  bookUpsellPublishDesc: string;
  bookPublishButton: string;
  bookHelp: string;
  // Book error
  bookErrorSubject: (title: string) => string;
  bookErrorBody: (title: string) => string;
  bookErrorRetry: string;
  bookErrorButton: string;
  // New subscription
  subscriptionSubject: (plan: string) => string;
  subscriptionBody: (plan: string) => string;
  subscriptionCredits: (credits: number) => string;
  subscriptionButton: string;
  // Subscription updated
  subscriptionUpdateSubject: string;
  subscriptionUpgradeBody: (oldPlan: string, newPlan: string) => string;
  subscriptionDowngradeBody: (oldPlan: string, newPlan: string) => string;
  subscriptionCancelBody: (plan: string, endDate: string) => string;
  subscriptionRenewBody: (plan: string) => string;
  subscriptionButton2: string;
  // Credit purchase
  creditPurchaseSubject: (credits: number) => string;
  creditPurchaseBody: (credits: number, pack: string) => string;
  creditPurchaseBalance: (balance: number) => string;
  creditPurchaseButton: string;
  // Addon purchased
  addonPurchaseSubject: (addon: string) => string;
  addonPurchaseBody: (addon: string, book: string) => string;
  addonPurchaseButton: string;
  // Refund
  refundSubject: string;
  refundBody: (credits: number, reason: string) => string;
  refundBalance: (balance: number) => string;
  // Addon completed
  addonCompleteSubject: (addon: string) => string;
  addonCompleteBody: (addon: string, book: string) => string;
  addonCompleteButton: string;
  // Publishing update
  publishingUpdateSubject: (status: string) => string;
  publishingUpdateBody: (book: string, status: string) => string;
  publishingStatuses: Record<string, string>;
  publishingUpdateButton: string;
  // Publishing completed
  publishingCompleteSubject: (book: string) => string;
  publishingCompleteBody: (book: string) => string;
  publishingCompleteButton: string;
  publishingCompleteCongrats: string;
  // Credits expiring
  creditsExpiringSubject: (credits: number) => string;
  creditsExpiringBody: (credits: number, date: string) => string;
  creditsExpiringButton: string;
  // Monthly summary
  monthlySummarySubject: (month: string) => string;
  monthlySummaryBody: (month: string) => string;
  monthlySummaryBooks: (count: number) => string;
  monthlySummaryCreditsUsed: (credits: number) => string;
  monthlySummaryCreditsRemaining: (credits: number) => string;
  monthlySummaryButton: string;
  // Purchase recovery
  recoverySubscriptionSubject: string;
  recoverySubscriptionBody: (planName: string) => string;
  recoveryCreditSubject: string;
  recoveryCreditBody: (packName: string) => string;
  recoveryButton: string;
  recoveryExpiry: string;
  // Addon names
  addonName: (kind: string) => string;
}

const translations: Record<string, EmailTranslations> = {
  en: {
    greeting: (name?: string) => name ? `Hi ${name},` : 'Hi,',
    footer: 'All rights reserved.',
    // Password reset
    resetSubject: 'Reset your password — BestSellers AI',
    resetBody: 'We received a request to reset your password. Click the button below to choose a new password.',
    resetButton: 'Reset Password',
    resetExpiry: 'This link will expire in <strong>1 hour</strong>.',
    resetIgnore: "If you didn't request a password reset, you can safely ignore this email.",
    // Welcome
    welcomeSubject: 'Welcome to BestSellers AI!',
    welcomeBody: () => `Welcome to <strong>BestSellers AI</strong>! Your account has been created and you're all set to start generating amazing books with AI.`,
    welcomeButton: 'Go to Dashboard',
    welcomeHelp: 'If you have any questions, feel free to reach out to our support team.',
    // Welcome + set password
    welcomeSetPasswordSubject: 'Welcome to BestSellers AI — Set your password',
    welcomeSetPasswordBody: 'Your account has been created! To access it anytime, please set your password by clicking the button below.',
    welcomeSetPasswordButton: 'Set My Password',
    welcomeSetPasswordExpiry: 'This link will expire in <strong>1 hour</strong>.',
    // Book generated + upsell
    bookSubject: (title) => `Your book "${title}" is ready! — BestSellers AI`,
    bookBody: (title) => `Great news! Your book <strong>"${title}"</strong> has been fully generated and is ready for you to review.`,
    bookButton: 'View Your Book',
    bookNextSteps: 'Take your book to the next level:',
    bookUpsellCover: '🎨 <strong>AI Cover</strong> — 6 professional cover variations',
    bookUpsellImages: '🖼️ <strong>Chapter Illustrations</strong> — unique images for each chapter',
    bookUpsellTranslation: '🌍 <strong>Translation</strong> — reach readers in 30+ languages',
    bookUpsellAudiobook: '🎧 <strong>Audiobook</strong> — convert your book to audio',
    bookUpsellPublish: '📦 <strong>Publish on Amazon</strong>',
    bookUpsellPublishDesc: 'Our editorial team handles the entire Amazon KDP publishing process for you — from formatting to listing.',
    bookPublishButton: 'Publish My Book',
    bookHelp: 'You can access all your books from your dashboard at any time.',
    // Book error
    bookErrorSubject: (title) => `Issue with your book "${title}" — BestSellers AI`,
    bookErrorBody: (title) => `We encountered an issue while generating your book <strong>"${title}"</strong>. Don't worry — you can retry the generation from your dashboard.`,
    bookErrorRetry: 'Your credits have not been charged for the failed attempt.',
    bookErrorButton: 'Go to Dashboard',
    // New subscription
    subscriptionSubject: (plan) => `Welcome to ${plan}! — BestSellers AI`,
    subscriptionBody: (plan) => `Your <strong>${plan}</strong> subscription is now active! You're ready to create amazing books with your new plan.`,
    subscriptionCredits: (credits) => `You now have <strong>${credits} credits</strong> available each month.`,
    subscriptionButton: 'Start Creating',
    // Subscription updated
    subscriptionUpdateSubject: 'Subscription updated — BestSellers AI',
    subscriptionUpgradeBody: (oldPlan, newPlan) => `Your subscription has been upgraded from <strong>${oldPlan}</strong> to <strong>${newPlan}</strong>. Enjoy your new benefits!`,
    subscriptionDowngradeBody: (oldPlan, newPlan) => `Your subscription has been changed from <strong>${oldPlan}</strong> to <strong>${newPlan}</strong>. The change will take effect at your next billing cycle.`,
    subscriptionCancelBody: (plan, endDate) => `Your <strong>${plan}</strong> subscription has been cancelled. You'll continue to have access until <strong>${endDate}</strong>.`,
    subscriptionRenewBody: (plan) => `Your <strong>${plan}</strong> subscription has been renewed. Your credits have been refreshed!`,
    subscriptionButton2: 'Manage Subscription',
    // Credit purchase
    creditPurchaseSubject: (credits) => `${credits} credits added! — BestSellers AI`,
    creditPurchaseBody: (credits, pack) => `Your purchase of <strong>${pack}</strong> is confirmed! <strong>${credits} credits</strong> have been added to your account.`,
    creditPurchaseBalance: (balance) => `Current balance: <strong>${balance} credits</strong>.`,
    creditPurchaseButton: 'Start Using Credits',
    // Addon purchased
    addonPurchaseSubject: (addon) => `${addon} requested — BestSellers AI`,
    addonPurchaseBody: (addon, book) => `Your <strong>${addon}</strong> add-on for <strong>"${book}"</strong> has been requested and is being processed.`,
    addonPurchaseButton: 'Track Progress',
    // Refund
    refundSubject: 'Credits refunded — BestSellers AI',
    refundBody: (credits, reason) => `<strong>${credits} credits</strong> have been refunded to your account. Reason: ${reason}.`,
    refundBalance: (balance) => `Current balance: <strong>${balance} credits</strong>.`,
    // Addon completed
    addonCompleteSubject: (addon) => `${addon} is ready! — BestSellers AI`,
    addonCompleteBody: (addon, book) => `Your <strong>${addon}</strong> add-on for <strong>"${book}"</strong> is ready!`,
    addonCompleteButton: 'View Result',
    // Publishing update
    publishingUpdateSubject: (status) => `Publishing update: ${status} — BestSellers AI`,
    publishingUpdateBody: (book, status) => `The publishing status for <strong>"${book}"</strong> has been updated to <strong>${status}</strong>.`,
    publishingStatuses: { PREPARING: 'Preparing', REVIEW: 'In Review', READY: 'Ready', SUBMITTED: 'Submitted to Amazon', PUBLISHED: 'Published', REJECTED: 'Rejected' },
    publishingUpdateButton: 'View Details',
    // Publishing completed
    publishingCompleteSubject: (book) => `"${book}" is published! 🎉 — BestSellers AI`,
    publishingCompleteBody: (book) => `Your book <strong>"${book}"</strong> has been successfully published on Amazon!`,
    publishingCompleteButton: 'View on Amazon',
    publishingCompleteCongrats: 'Congratulations, you are now a published author! 🎉',
    // Credits expiring
    creditsExpiringSubject: (credits) => `${credits} credits expiring soon — BestSellers AI`,
    creditsExpiringBody: (credits, date) => `You have <strong>${credits} credits</strong> that will expire on <strong>${date}</strong>. Use them before they're gone!`,
    creditsExpiringButton: 'Use My Credits',
    // Monthly summary
    monthlySummarySubject: (month) => `Your ${month} summary — BestSellers AI`,
    monthlySummaryBody: (month) => `Here's your activity summary for <strong>${month}</strong>:`,
    monthlySummaryBooks: (count) => `📖 <strong>${count}</strong> book${count !== 1 ? 's' : ''} created`,
    monthlySummaryCreditsUsed: (credits) => `⚡ <strong>${credits}</strong> credits used`,
    monthlySummaryCreditsRemaining: (credits) => `💰 <strong>${credits}</strong> credits remaining`,
    monthlySummaryButton: 'Go to Dashboard',
    // Purchase recovery
    recoverySubscriptionSubject: 'Still thinking about your plan? — BestSellers AI',
    recoverySubscriptionBody: (planName) => `You were about to subscribe to the <strong>${planName}</strong> plan but didn't finish. Your plan is still waiting for you — pick up where you left off and start creating professional books today.`,
    recoveryCreditSubject: 'Your credits are waiting — BestSellers AI',
    recoveryCreditBody: (packName) => `You were about to purchase the <strong>${packName}</strong> credit pack but didn't finish. Complete your purchase now and start creating.`,
    recoveryButton: 'Complete My Purchase',
    recoveryExpiry: 'This link will take you back to our pricing page.',
    // Addon names
    addonName: (kind) => ({
      ADDON_COVER: 'AI Cover',
      ADDON_IMAGES: 'Chapter Illustrations',
      ADDON_TRANSLATION: 'Book Translation',
      ADDON_COVER_TRANSLATION: 'Cover Translation',
      ADDON_AUDIOBOOK: 'Audiobook',
      ADDON_AMAZON_STANDARD: 'Amazon Standard Publishing',
      ADDON_AMAZON_PREMIUM: 'Amazon Premium Publishing',
    }[kind] ?? kind),
  },
  'pt-BR': {
    greeting: (name?: string) => name ? `Oi ${name},` : 'Oi,',
    footer: 'Todos os direitos reservados.',
    resetSubject: 'Redefinir sua senha — BestSellers AI',
    resetBody: 'Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para escolher uma nova senha.',
    resetButton: 'Redefinir Senha',
    resetExpiry: 'Este link expira em <strong>1 hora</strong>.',
    resetIgnore: 'Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.',
    welcomeSubject: 'Bem-vindo ao BestSellers AI!',
    welcomeBody: () => `Bem-vindo ao <strong>BestSellers AI</strong>! Sua conta foi criada e você está pronto para começar a gerar livros incríveis com IA.`,
    welcomeButton: 'Ir para o Painel',
    welcomeHelp: 'Se tiver alguma dúvida, entre em contato com nossa equipe de suporte.',
    welcomeSetPasswordSubject: 'Bem-vindo ao BestSellers AI — Defina sua senha',
    welcomeSetPasswordBody: 'Sua conta foi criada! Para acessar a qualquer momento, defina sua senha clicando no botão abaixo.',
    welcomeSetPasswordButton: 'Definir Minha Senha',
    welcomeSetPasswordExpiry: 'Este link expira em <strong>1 hora</strong>.',
    bookSubject: (title) => `Seu livro "${title}" está pronto! — BestSellers AI`,
    bookBody: (title) => `Ótimas notícias! Seu livro <strong>"${title}"</strong> foi totalmente gerado e está pronto para revisão.`,
    bookButton: 'Ver Seu Livro',
    bookNextSteps: 'Leve seu livro para o próximo nível:',
    bookUpsellCover: '🎨 <strong>Capa com IA</strong> — 6 variações profissionais de capa',
    bookUpsellImages: '🖼️ <strong>Ilustrações</strong> — imagens únicas para cada capítulo',
    bookUpsellTranslation: '🌍 <strong>Tradução</strong> — alcance leitores em 30+ idiomas',
    bookUpsellAudiobook: '🎧 <strong>Audiobook</strong> — converta seu livro em áudio',
    bookUpsellPublish: '📦 <strong>Publique na Amazon</strong>',
    bookUpsellPublishDesc: 'Nossa equipe editorial cuida de todo o processo de publicação na Amazon KDP por você — da formatação à listagem.',
    bookPublishButton: 'Publicar Meu Livro',
    bookHelp: 'Você pode acessar todos os seus livros no painel a qualquer momento.',
    bookErrorSubject: (title) => `Problema com seu livro "${title}" — BestSellers AI`,
    bookErrorBody: (title) => `Encontramos um problema ao gerar seu livro <strong>"${title}"</strong>. Não se preocupe — você pode tentar novamente pelo painel.`,
    bookErrorRetry: 'Seus créditos não foram cobrados pela tentativa que falhou.',
    bookErrorButton: 'Ir para o Painel',
    subscriptionSubject: (plan) => `Bem-vindo ao ${plan}! — BestSellers AI`,
    subscriptionBody: (plan) => `Sua assinatura <strong>${plan}</strong> está ativa! Você está pronto para criar livros incríveis com seu novo plano.`,
    subscriptionCredits: (credits) => `Você agora tem <strong>${credits} créditos</strong> disponíveis por mês.`,
    subscriptionButton: 'Começar a Criar',
    subscriptionUpdateSubject: 'Assinatura atualizada — BestSellers AI',
    subscriptionUpgradeBody: (oldPlan, newPlan) => `Sua assinatura foi atualizada de <strong>${oldPlan}</strong> para <strong>${newPlan}</strong>. Aproveite os novos benefícios!`,
    subscriptionDowngradeBody: (oldPlan, newPlan) => `Sua assinatura foi alterada de <strong>${oldPlan}</strong> para <strong>${newPlan}</strong>. A mudança entra em vigor no próximo ciclo de cobrança.`,
    subscriptionCancelBody: (plan, endDate) => `Sua assinatura <strong>${plan}</strong> foi cancelada. Você continuará tendo acesso até <strong>${endDate}</strong>.`,
    subscriptionRenewBody: (plan) => `Sua assinatura <strong>${plan}</strong> foi renovada. Seus créditos foram recarregados!`,
    subscriptionButton2: 'Gerenciar Assinatura',
    creditPurchaseSubject: (credits) => `${credits} créditos adicionados! — BestSellers AI`,
    creditPurchaseBody: (credits, pack) => `Sua compra do <strong>${pack}</strong> foi confirmada! <strong>${credits} créditos</strong> foram adicionados à sua conta.`,
    creditPurchaseBalance: (balance) => `Saldo atual: <strong>${balance} créditos</strong>.`,
    creditPurchaseButton: 'Usar Meus Créditos',
    addonPurchaseSubject: (addon) => `${addon} solicitado — BestSellers AI`,
    addonPurchaseBody: (addon, book) => `Seu complemento <strong>${addon}</strong> para <strong>"${book}"</strong> foi solicitado e está sendo processado.`,
    addonPurchaseButton: 'Acompanhar Progresso',
    refundSubject: 'Créditos reembolsados — BestSellers AI',
    refundBody: (credits, reason) => `<strong>${credits} créditos</strong> foram devolvidos à sua conta. Motivo: ${reason}.`,
    refundBalance: (balance) => `Saldo atual: <strong>${balance} créditos</strong>.`,
    addonCompleteSubject: (addon) => `${addon} está pronto! — BestSellers AI`,
    addonCompleteBody: (addon, book) => `Seu complemento <strong>${addon}</strong> para <strong>"${book}"</strong> está pronto!`,
    addonCompleteButton: 'Ver Resultado',
    publishingUpdateSubject: (status) => `Atualização de publicação: ${status} — BestSellers AI`,
    publishingUpdateBody: (book, status) => `O status da publicação de <strong>"${book}"</strong> foi atualizado para <strong>${status}</strong>.`,
    publishingStatuses: { PREPARING: 'Preparando', REVIEW: 'Em Revisão', READY: 'Pronto', SUBMITTED: 'Enviado para Amazon', PUBLISHED: 'Publicado', REJECTED: 'Rejeitado' },
    publishingUpdateButton: 'Ver Detalhes',
    publishingCompleteSubject: (book) => `"${book}" foi publicado! 🎉 — BestSellers AI`,
    publishingCompleteBody: (book) => `Seu livro <strong>"${book}"</strong> foi publicado com sucesso na Amazon!`,
    publishingCompleteButton: 'Ver na Amazon',
    publishingCompleteCongrats: 'Parabéns, você agora é um autor publicado! 🎉',
    creditsExpiringSubject: (credits) => `${credits} créditos expirando em breve — BestSellers AI`,
    creditsExpiringBody: (credits, date) => `Você tem <strong>${credits} créditos</strong> que vão expirar em <strong>${date}</strong>. Use-os antes que expirem!`,
    creditsExpiringButton: 'Usar Meus Créditos',
    monthlySummarySubject: (month) => `Seu resumo de ${month} — BestSellers AI`,
    monthlySummaryBody: (month) => `Aqui está seu resumo de atividades de <strong>${month}</strong>:`,
    monthlySummaryBooks: (count) => `📖 <strong>${count}</strong> livro${count !== 1 ? 's' : ''} criado${count !== 1 ? 's' : ''}`,
    monthlySummaryCreditsUsed: (credits) => `⚡ <strong>${credits}</strong> créditos usados`,
    monthlySummaryCreditsRemaining: (credits) => `💰 <strong>${credits}</strong> créditos restantes`,
    monthlySummaryButton: 'Ir para o Painel',
    recoverySubscriptionSubject: 'Ainda pensando no seu plano? — BestSellers AI',
    recoverySubscriptionBody: (planName) => `Você estava prestes a assinar o plano <strong>${planName}</strong> mas não finalizou. Seu plano ainda está esperando — continue de onde parou e comece a criar livros profissionais hoje.`,
    recoveryCreditSubject: 'Seus créditos estão esperando — BestSellers AI',
    recoveryCreditBody: (packName) => `Você estava prestes a comprar o pacote <strong>${packName}</strong> mas não finalizou. Complete sua compra agora e comece a criar.`,
    recoveryButton: 'Completar Minha Compra',
    recoveryExpiry: 'Este link vai te levar de volta à nossa página de preços.',
    addonName: (kind) => ({
      ADDON_COVER: 'Capa com IA',
      ADDON_IMAGES: 'Ilustrações dos Capítulos',
      ADDON_TRANSLATION: 'Tradução do Livro',
      ADDON_COVER_TRANSLATION: 'Tradução da Capa',
      ADDON_AUDIOBOOK: 'Audiobook',
      ADDON_AMAZON_STANDARD: 'Publicação Amazon Standard',
      ADDON_AMAZON_PREMIUM: 'Publicação Amazon Premium',
    }[kind] ?? kind),
  },
  es: {
    greeting: (name?: string) => name ? `Hola ${name},` : 'Hola,',
    footer: 'Todos los derechos reservados.',
    resetSubject: 'Restablecer tu contraseña — BestSellers AI',
    resetBody: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva contraseña.',
    resetButton: 'Restablecer Contraseña',
    resetExpiry: 'Este enlace expirará en <strong>1 hora</strong>.',
    resetIgnore: 'Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo con seguridad.',
    welcomeSubject: '¡Bienvenido a BestSellers AI!',
    welcomeBody: () => `¡Bienvenido a <strong>BestSellers AI</strong>! Tu cuenta ha sido creada y estás listo para empezar a generar libros increíbles con IA.`,
    welcomeButton: 'Ir al Panel',
    welcomeHelp: 'Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.',
    welcomeSetPasswordSubject: 'Bienvenido a BestSellers AI — Define tu contraseña',
    welcomeSetPasswordBody: '¡Tu cuenta ha sido creada! Para acceder en cualquier momento, define tu contraseña haciendo clic en el botón de abajo.',
    welcomeSetPasswordButton: 'Definir Mi Contraseña',
    welcomeSetPasswordExpiry: 'Este enlace expirará en <strong>1 hora</strong>.',
    bookSubject: (title) => `¡Tu libro "${title}" está listo! — BestSellers AI`,
    bookBody: (title) => `¡Excelentes noticias! Tu libro <strong>"${title}"</strong> ha sido completamente generado y está listo para que lo revises.`,
    bookButton: 'Ver Tu Libro',
    bookNextSteps: 'Lleva tu libro al siguiente nivel:',
    bookUpsellCover: '🎨 <strong>Portada con IA</strong> — 6 variaciones profesionales de portada',
    bookUpsellImages: '🖼️ <strong>Ilustraciones</strong> — imágenes únicas para cada capítulo',
    bookUpsellTranslation: '🌍 <strong>Traducción</strong> — llega a lectores en 30+ idiomas',
    bookUpsellAudiobook: '🎧 <strong>Audiolibro</strong> — convierte tu libro en audio',
    bookUpsellPublish: '📦 <strong>Publica en Amazon</strong>',
    bookUpsellPublishDesc: 'Nuestro equipo editorial se encarga de todo el proceso de publicación en Amazon KDP por ti — del formato al listado.',
    bookPublishButton: 'Publicar Mi Libro',
    bookHelp: 'Puedes acceder a todos tus libros desde tu panel en cualquier momento.',
    bookErrorSubject: (title) => `Problema con tu libro "${title}" — BestSellers AI`,
    bookErrorBody: (title) => `Encontramos un problema al generar tu libro <strong>"${title}"</strong>. No te preocupes — puedes intentar de nuevo desde tu panel.`,
    bookErrorRetry: 'Tus créditos no fueron cobrados por el intento fallido.',
    bookErrorButton: 'Ir al Panel',
    subscriptionSubject: (plan) => `¡Bienvenido a ${plan}! — BestSellers AI`,
    subscriptionBody: (plan) => `¡Tu suscripción <strong>${plan}</strong> está activa! Estás listo para crear libros increíbles con tu nuevo plan.`,
    subscriptionCredits: (credits) => `Ahora tienes <strong>${credits} créditos</strong> disponibles cada mes.`,
    subscriptionButton: 'Empezar a Crear',
    subscriptionUpdateSubject: 'Suscripción actualizada — BestSellers AI',
    subscriptionUpgradeBody: (oldPlan, newPlan) => `Tu suscripción ha sido actualizada de <strong>${oldPlan}</strong> a <strong>${newPlan}</strong>. ¡Disfruta tus nuevos beneficios!`,
    subscriptionDowngradeBody: (oldPlan, newPlan) => `Tu suscripción ha sido cambiada de <strong>${oldPlan}</strong> a <strong>${newPlan}</strong>. El cambio entrará en vigor en tu próximo ciclo de facturación.`,
    subscriptionCancelBody: (plan, endDate) => `Tu suscripción <strong>${plan}</strong> ha sido cancelada. Continuarás teniendo acceso hasta <strong>${endDate}</strong>.`,
    subscriptionRenewBody: (plan) => `¡Tu suscripción <strong>${plan}</strong> ha sido renovada! Tus créditos han sido recargados.`,
    subscriptionButton2: 'Gestionar Suscripción',
    creditPurchaseSubject: (credits) => `¡${credits} créditos añadidos! — BestSellers AI`,
    creditPurchaseBody: (credits, pack) => `¡Tu compra de <strong>${pack}</strong> está confirmada! <strong>${credits} créditos</strong> han sido añadidos a tu cuenta.`,
    creditPurchaseBalance: (balance) => `Saldo actual: <strong>${balance} créditos</strong>.`,
    creditPurchaseButton: 'Usar Mis Créditos',
    addonPurchaseSubject: (addon) => `${addon} solicitado — BestSellers AI`,
    addonPurchaseBody: (addon, book) => `Tu complemento <strong>${addon}</strong> para <strong>"${book}"</strong> ha sido solicitado y está siendo procesado.`,
    addonPurchaseButton: 'Seguir Progreso',
    refundSubject: 'Créditos reembolsados — BestSellers AI',
    refundBody: (credits, reason) => `<strong>${credits} créditos</strong> han sido devueltos a tu cuenta. Motivo: ${reason}.`,
    refundBalance: (balance) => `Saldo actual: <strong>${balance} créditos</strong>.`,
    addonCompleteSubject: (addon) => `¡${addon} está listo! — BestSellers AI`,
    addonCompleteBody: (addon, book) => `¡Tu complemento <strong>${addon}</strong> para <strong>"${book}"</strong> está listo!`,
    addonCompleteButton: 'Ver Resultado',
    publishingUpdateSubject: (status) => `Actualización de publicación: ${status} — BestSellers AI`,
    publishingUpdateBody: (book, status) => `El estado de la publicación de <strong>"${book}"</strong> ha sido actualizado a <strong>${status}</strong>.`,
    publishingStatuses: { PREPARING: 'Preparando', REVIEW: 'En Revisión', READY: 'Listo', SUBMITTED: 'Enviado a Amazon', PUBLISHED: 'Publicado', REJECTED: 'Rechazado' },
    publishingUpdateButton: 'Ver Detalles',
    publishingCompleteSubject: (book) => `¡"${book}" ha sido publicado! 🎉 — BestSellers AI`,
    publishingCompleteBody: (book) => `¡Tu libro <strong>"${book}"</strong> ha sido publicado con éxito en Amazon!`,
    publishingCompleteButton: 'Ver en Amazon',
    publishingCompleteCongrats: '¡Felicidades, ahora eres un autor publicado! 🎉',
    creditsExpiringSubject: (credits) => `${credits} créditos por expirar — BestSellers AI`,
    creditsExpiringBody: (credits, date) => `Tienes <strong>${credits} créditos</strong> que expirarán el <strong>${date}</strong>. ¡Úsalos antes de que expiren!`,
    creditsExpiringButton: 'Usar Mis Créditos',
    monthlySummarySubject: (month) => `Tu resumen de ${month} — BestSellers AI`,
    monthlySummaryBody: (month) => `Aquí está tu resumen de actividad de <strong>${month}</strong>:`,
    monthlySummaryBooks: (count) => `📖 <strong>${count}</strong> libro${count !== 1 ? 's' : ''} creado${count !== 1 ? 's' : ''}`,
    monthlySummaryCreditsUsed: (credits) => `⚡ <strong>${credits}</strong> créditos usados`,
    monthlySummaryCreditsRemaining: (credits) => `💰 <strong>${credits}</strong> créditos restantes`,
    monthlySummaryButton: 'Ir al Panel',
    recoverySubscriptionSubject: '¿Aún pensando en tu plan? — BestSellers AI',
    recoverySubscriptionBody: (planName) => `Estabas a punto de suscribirte al plan <strong>${planName}</strong> pero no terminaste. Tu plan te sigue esperando — retoma donde lo dejaste y empieza a crear libros profesionales hoy.`,
    recoveryCreditSubject: 'Tus créditos te esperan — BestSellers AI',
    recoveryCreditBody: (packName) => `Estabas a punto de comprar el paquete <strong>${packName}</strong> pero no terminaste. Completa tu compra ahora y empieza a crear.`,
    recoveryButton: 'Completar Mi Compra',
    recoveryExpiry: 'Este enlace te llevará de vuelta a nuestra página de precios.',
    addonName: (kind) => ({
      ADDON_COVER: 'Portada con IA',
      ADDON_IMAGES: 'Ilustraciones de Capítulos',
      ADDON_TRANSLATION: 'Traducción del Libro',
      ADDON_COVER_TRANSLATION: 'Traducción de Portada',
      ADDON_AUDIOBOOK: 'Audiolibro',
      ADDON_AMAZON_STANDARD: 'Publicación Amazon Standard',
      ADDON_AMAZON_PREMIUM: 'Publicación Amazon Premium',
    }[kind] ?? kind),
  },
};

export function getTranslations(locale: string): EmailTranslations {
  return translations[locale] ?? translations.en;
}
