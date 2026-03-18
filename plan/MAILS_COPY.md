# Email Copies — BestSellers AI

All transactional email copies used by the platform, in all 3 supported languages.

Source: `apps/api/src/email/email-translations.ts` + `apps/api/src/email/email-templates.ts`

---

## 1. Password Reset

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Reset your password — BestSellers AI | Redefinir sua senha — BestSellers AI | Restablecer tu contraseña — BestSellers AI |
| **Greeting** | Hi {name}, | Oi {name}, | Hola {name}, |
| **Body** | We received a request to reset your password. Click the button below to choose a new password. | Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para escolher uma nova senha. | Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva contraseña. |
| **Button** | Reset Password | Redefinir Senha | Restablecer Contraseña |
| **Expiry** | This link will expire in **1 hour**. | Este link expira em **1 hora**. | Este enlace expirará en **1 hora**. |
| **Ignore** | If you didn't request a password reset, you can safely ignore this email. | Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. | Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo con seguridad. |

---

## 2. Welcome

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Welcome to BestSellers AI! | Bem-vindo ao BestSellers AI! | ¡Bienvenido a BestSellers AI! |
| **Body** | Welcome to **BestSellers AI**! Your account has been created and you're all set to start generating amazing books with AI. | Bem-vindo ao **BestSellers AI**! Sua conta foi criada e você está pronto para começar a gerar livros incríveis com IA. | ¡Bienvenido a **BestSellers AI**! Tu cuenta ha sido creada y estás listo para empezar a generar libros increíbles con IA. |
| **Button** | Go to Dashboard | Ir para o Painel | Ir al Panel |
| **Help** | If you have any questions, feel free to reach out to our support team. | Se tiver alguma dúvida, entre em contato com nossa equipe de suporte. | Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte. |

---

## 3. Welcome + Set Password

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Welcome to BestSellers AI — Set your password | Bem-vindo ao BestSellers AI — Defina sua senha | Bienvenido a BestSellers AI — Define tu contraseña |
| **Body** | Your account has been created! To access it anytime, please set your password by clicking the button below. | Sua conta foi criada! Para acessar a qualquer momento, defina sua senha clicando no botão abaixo. | ¡Tu cuenta ha sido creada! Para acceder en cualquier momento, define tu contraseña haciendo clic en el botón de abajo. |
| **Button** | Set My Password | Definir Minha Senha | Definir Mi Contraseña |
| **Expiry** | This link will expire in **1 hour**. | Este link expira em **1 hora**. | Este enlace expirará en **1 hora**. |

---

## 4. Book Generated + Upsell

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Your book "{title}" is ready! — BestSellers AI | Seu livro "{title}" está pronto! — BestSellers AI | ¡Tu libro "{title}" está listo! — BestSellers AI |
| **Body** | Great news! Your book **"{title}"** has been fully generated and is ready for you to review. | Ótimas notícias! Seu livro **"{title}"** foi totalmente gerado e está pronto para revisão. | ¡Excelentes noticias! Tu libro **"{title}"** ha sido completamente generado y está listo para que lo revises. |
| **Button** | View Your Book | Ver Seu Livro | Ver Tu Libro |
| **Next Steps** | Take your book to the next level: | Leve seu livro para o próximo nível: | Lleva tu libro al siguiente nivel: |
| **Upsell Cover** | 🎨 **AI Cover** — 6 professional cover variations | 🎨 **Capa com IA** — 6 variações profissionais de capa | 🎨 **Portada con IA** — 6 variaciones profesionales de portada |
| **Upsell Images** | 🖼️ **Chapter Illustrations** — unique images for each chapter | 🖼️ **Ilustrações** — imagens únicas para cada capítulo | 🖼️ **Ilustraciones** — imágenes únicas para cada capítulo |
| **Upsell Translation** | 🌍 **Translation** — reach readers in 30+ languages | 🌍 **Tradução** — alcance leitores em 30+ idiomas | 🌍 **Traducción** — llega a lectores en 30+ idiomas |
| **Upsell Audiobook** | 🎧 **Audiobook** — convert your book to audio | 🎧 **Audiobook** — converta seu livro em áudio | 🎧 **Audiolibro** — convierte tu libro en audio |
| **Upsell Publish** | 📦 **Publish on Amazon** | 📦 **Publique na Amazon** | 📦 **Publica en Amazon** |
| **Publish Desc** | Our editorial team handles the entire Amazon KDP publishing process for you — from formatting to listing. | Nossa equipe editorial cuida de todo o processo de publicação na Amazon KDP por você — da formatação à listagem. | Nuestro equipo editorial se encarga de todo el proceso de publicación en Amazon KDP por ti — del formato al listado. |
| **Publish Button** | Publish My Book | Publicar Meu Livro | Publicar Mi Libro |
| **Help** | You can access all your books from your dashboard at any time. | Você pode acessar todos os seus livros no painel a qualquer momento. | Puedes acceder a todos tus libros desde tu panel en cualquier momento. |

---

## 5. Book Error

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Issue with your book "{title}" — BestSellers AI | Problema com seu livro "{title}" — BestSellers AI | Problema con tu libro "{title}" — BestSellers AI |
| **Body** | We encountered an issue while generating your book **"{title}"**. Don't worry — you can retry the generation from your dashboard. | Encontramos um problema ao gerar seu livro **"{title}"**. Não se preocupe — você pode tentar novamente pelo painel. | Encontramos un problema al generar tu libro **"{title}"**. No te preocupes — puedes intentar de nuevo desde tu panel. |
| **Retry** | Your credits have not been charged for the failed attempt. | Seus créditos não foram cobrados pela tentativa que falhou. | Tus créditos no fueron cobrados por el intento fallido. |
| **Button** | Go to Dashboard | Ir para o Painel | Ir al Panel |

---

## 6. New Subscription

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Welcome to {plan}! — BestSellers AI | Bem-vindo ao {plan}! — BestSellers AI | ¡Bienvenido a {plan}! — BestSellers AI |
| **Body** | Your **{plan}** subscription is now active! You're ready to create amazing books with your new plan. | Sua assinatura **{plan}** está ativa! Você está pronto para criar livros incríveis com seu novo plano. | ¡Tu suscripción **{plan}** está activa! Estás listo para crear libros increíbles con tu nuevo plan. |
| **Credits** | You now have **{credits} credits** available each month. | Você agora tem **{credits} créditos** disponíveis por mês. | Ahora tienes **{credits} créditos** disponibles cada mes. |
| **Button** | Start Creating | Começar a Criar | Empezar a Crear |

---

## 7. Subscription Updated

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Subscription updated — BestSellers AI | Assinatura atualizada — BestSellers AI | Suscripción actualizada — BestSellers AI |
| **Upgrade** | Your subscription has been upgraded from **{oldPlan}** to **{newPlan}**. Enjoy your new benefits! | Sua assinatura foi atualizada de **{oldPlan}** para **{newPlan}**. Aproveite os novos benefícios! | Tu suscripción ha sido actualizada de **{oldPlan}** a **{newPlan}**. ¡Disfruta tus nuevos beneficios! |
| **Downgrade** | Your subscription has been changed from **{oldPlan}** to **{newPlan}**. The change will take effect at your next billing cycle. | Sua assinatura foi alterada de **{oldPlan}** para **{newPlan}**. A mudança entra em vigor no próximo ciclo de cobrança. | Tu suscripción ha sido cambiada de **{oldPlan}** a **{newPlan}**. El cambio entrará en vigor en tu próximo ciclo de facturación. |
| **Cancel** | Your **{plan}** subscription has been cancelled. You'll continue to have access until **{endDate}**. | Sua assinatura **{plan}** foi cancelada. Você continuará tendo acesso até **{endDate}**. | Tu suscripción **{plan}** ha sido cancelada. Continuarás teniendo acceso hasta **{endDate}**. |
| **Renew** | Your **{plan}** subscription has been renewed. Your credits have been refreshed! | Sua assinatura **{plan}** foi renovada. Seus créditos foram recarregados! | ¡Tu suscripción **{plan}** ha sido renovada! Tus créditos han sido recargados. |
| **Button** | Manage Subscription | Gerenciar Assinatura | Gestionar Suscripción |

---

## 8. Credit Purchase

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | {credits} credits added! — BestSellers AI | {credits} créditos adicionados! — BestSellers AI | ¡{credits} créditos añadidos! — BestSellers AI |
| **Body** | Your purchase of **{pack}** is confirmed! **{credits} credits** have been added to your account. | Sua compra do **{pack}** foi confirmada! **{credits} créditos** foram adicionados à sua conta. | ¡Tu compra de **{pack}** está confirmada! **{credits} créditos** han sido añadidos a tu cuenta. |
| **Balance** | Current balance: **{balance} credits**. | Saldo atual: **{balance} créditos**. | Saldo actual: **{balance} créditos**. |
| **Button** | Start Using Credits | Usar Meus Créditos | Usar Mis Créditos |

---

## 9. Addon Purchased

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | {addon} requested — BestSellers AI | {addon} solicitado — BestSellers AI | {addon} solicitado — BestSellers AI |
| **Body** | Your **{addon}** add-on for **"{book}"** has been requested and is being processed. | Seu complemento **{addon}** para **"{book}"** foi solicitado e está sendo processado. | Tu complemento **{addon}** para **"{book}"** ha sido solicitado y está siendo procesado. |
| **Button** | Track Progress | Acompanhar Progresso | Seguir Progreso |

---

## 10. Refund

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Credits refunded — BestSellers AI | Créditos reembolsados — BestSellers AI | Créditos reembolsados — BestSellers AI |
| **Body** | **{credits} credits** have been refunded to your account. Reason: {reason}. | **{credits} créditos** foram devolvidos à sua conta. Motivo: {reason}. | **{credits} créditos** han sido devueltos a tu cuenta. Motivo: {reason}. |
| **Balance** | Current balance: **{balance} credits**. | Saldo atual: **{balance} créditos**. | Saldo actual: **{balance} créditos**. |

---

## 11. Addon Completed

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | {addon} is ready! — BestSellers AI | {addon} está pronto! — BestSellers AI | ¡{addon} está listo! — BestSellers AI |
| **Body** | Your **{addon}** add-on for **"{book}"** is ready! | Seu complemento **{addon}** para **"{book}"** está pronto! | ¡Tu complemento **{addon}** para **"{book}"** está listo! |
| **Button** | View Result | Ver Resultado | Ver Resultado |

---

## 12. Publishing Update

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Publishing update: {status} — BestSellers AI | Atualização de publicação: {status} — BestSellers AI | Actualización de publicación: {status} — BestSellers AI |
| **Body** | The publishing status for **"{book}"** has been updated to **{status}**. | O status da publicação de **"{book}"** foi atualizado para **{status}**. | El estado de la publicación de **"{book}"** ha sido actualizado a **{status}**. |
| **Button** | View Details | Ver Detalhes | Ver Detalles |

**Publishing Status Labels:**

| Status | English | Português (BR) | Español |
|--------|---------|----------------|---------|
| PREPARING | Preparing | Preparando | Preparando |
| REVIEW | In Review | Em Revisão | En Revisión |
| READY | Ready | Pronto | Listo |
| SUBMITTED | Submitted to Amazon | Enviado para Amazon | Enviado a Amazon |
| PUBLISHED | Published | Publicado | Publicado |
| REJECTED | Rejected | Rejeitado | Rechazado |

---

## 13. Publishing Completed

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | "{book}" is published! 🎉 — BestSellers AI | "{book}" foi publicado! 🎉 — BestSellers AI | ¡"{book}" ha sido publicado! 🎉 — BestSellers AI |
| **Body** | Your book **"{book}"** has been successfully published on Amazon! | Seu livro **"{book}"** foi publicado com sucesso na Amazon! | ¡Tu libro **"{book}"** ha sido publicado con éxito en Amazon! |
| **Congrats** | Congratulations, you are now a published author! 🎉 | Parabéns, você agora é um autor publicado! 🎉 | ¡Felicidades, ahora eres un autor publicado! 🎉 |
| **Button** | View on Amazon | Ver na Amazon | Ver en Amazon |

---

## 14. Credits Expiring

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | {credits} credits expiring soon — BestSellers AI | {credits} créditos expirando em breve — BestSellers AI | {credits} créditos por expirar — BestSellers AI |
| **Body** | You have **{credits} credits** that will expire on **{date}**. Use them before they're gone! | Você tem **{credits} créditos** que vão expirar em **{date}**. Use-os antes que expirem! | Tienes **{credits} créditos** que expirarán el **{date}**. ¡Úsalos antes de que expiren! |
| **Button** | Use My Credits | Usar Meus Créditos | Usar Mis Créditos |

---

## 15. Monthly Summary

| | English | Português (BR) | Español |
|---|---------|----------------|---------|
| **Subject** | Your {month} summary — BestSellers AI | Seu resumo de {month} — BestSellers AI | Tu resumen de {month} — BestSellers AI |
| **Body** | Here's your activity summary for **{month}**: | Aqui está seu resumo de atividades de **{month}**: | Aquí está tu resumen de actividad de **{month}**: |
| **Books** | 📖 **{count}** book(s) created | 📖 **{count}** livro(s) criado(s) | 📖 **{count}** libro(s) creado(s) |
| **Credits Used** | ⚡ **{credits}** credits used | ⚡ **{credits}** créditos usados | ⚡ **{credits}** créditos usados |
| **Credits Remaining** | 💰 **{credits}** credits remaining | 💰 **{credits}** créditos restantes | 💰 **{credits}** créditos restantes |
| **Button** | Go to Dashboard | Ir para o Painel | Ir al Panel |

---

## Addon Names (used in emails 9 and 11)

| Addon Kind | English | Português (BR) | Español |
|------------|---------|----------------|---------|
| ADDON_COVER | AI Cover | Capa com IA | Portada con IA |
| ADDON_IMAGES | Chapter Illustrations | Ilustrações dos Capítulos | Ilustraciones de Capítulos |
| ADDON_TRANSLATION | Book Translation | Tradução do Livro | Traducción del Libro |
| ADDON_COVER_TRANSLATION | Cover Translation | Tradução da Capa | Traducción de Portada |
| ADDON_AUDIOBOOK | Audiobook | Audiobook | Audiolibro |
| ADDON_AMAZON_STANDARD | Amazon Standard Publishing | Publicação Amazon Standard | Publicación Amazon Standard |
| ADDON_AMAZON_PREMIUM | Amazon Premium Publishing | Publicação Amazon Premium | Publicación Amazon Premium |

---

## Shared Elements

| Element | English | Português (BR) | Español |
|---------|---------|----------------|---------|
| **Footer** | All rights reserved. | Todos os direitos reservados. | Todos los derechos reservados. |
| **Greeting** | Hi {name}, | Oi {name}, | Hola {name}, |

## Email Template Structure

All emails use a shared dark-themed HTML layout:
- Background: `#0D0F1C`
- Card: `#1A1D2E` with rounded corners and subtle border
- Accent color: `#F59E0B` (amber/gold)
- Header: 📖 Best Sellers AI Platform logo
- Primary button: solid amber (`#F59E0B`) with dark text
- Outline button: amber border with amber text
- Info box: amber-tinted background with amber border
- Footer: © {year} BestSellers AI. {footer text}
