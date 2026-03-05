import LegalLayout from '@/components/layout/LegalLayout'

export const metadata = {
  title: 'Política de Cookies — Best Sellers AI',
  description: 'Saiba como a Best Sellers AI utiliza cookies e tecnologias similares.',
}

const sections = [
  {
    title: 'O que são Cookies',
    content:
      'Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa a Plataforma. Eles ajudam a lembrar suas preferências, manter sua sessão ativa e entender como você usa o serviço.',
  },
  {
    title: 'Cookies Essenciais',
    content: [
      'Autenticação de sessão: mantêm você conectado durante o uso da Plataforma.',
      'Segurança: protegem contra ataques CSRF e outras ameaças.',
      'Preferências básicas: lembram configurações como idioma selecionado.',
      'Estes cookies são necessários para o funcionamento da Plataforma e não podem ser desativados.',
    ],
  },
  {
    title: 'Cookies de Desempenho e Análise',
    content: [
      'Análise de uso: coletamos dados agregados sobre quais funcionalidades são mais utilizadas para melhorar a Plataforma.',
      'Diagnóstico de erros: registramos erros técnicos para corrigi-los.',
      'Estes dados são anonimizados e não permitem sua identificação individual.',
    ],
  },
  {
    title: 'Cookies de Funcionalidade',
    content: [
      'Lembram suas preferências de uso (ex: tema, visualização preferida).',
      'Salvam o estado de formulários e fluxos de trabalho em andamento.',
      'Personalizam a experiência com base em interações anteriores.',
    ],
  },
  {
    title: 'Cookies de Marketing',
    content:
      'Podemos utilizar pixels ou scripts de plataformas de anúncios (ex: Meta Pixel, Google Ads) para mensurar a eficácia das nossas campanhas. Estes cookies só são ativados com seu consentimento explícito.',
  },
  {
    title: 'Cookies de Terceiros',
    content: [
      'Stripe: para processamento seguro de pagamentos.',
      'Intercom ou similar: para suporte ao cliente via chat (quando disponível).',
      'Esses terceiros possuem suas próprias políticas de privacidade, sobre as quais não temos controle.',
    ],
  },
  {
    title: 'Gerenciar Cookies',
    content: [
      'Você pode gerenciar ou desativar cookies nas configurações do seu navegador.',
      'Desativar cookies essenciais pode comprometer o funcionamento da Plataforma.',
      'Para desativar cookies de marketing, você pode usar as ferramentas de opt-out de cada plataforma (ex: Google Ads Settings, Meta Ad Preferences).',
      'Ao continuar usando a Plataforma após visualizar este aviso, você consente com o uso dos cookies essenciais.',
    ],
  },
  {
    title: 'Tempo de Armazenamento',
    content: [
      'Cookies de sessão: excluídos quando você fecha o navegador.',
      'Cookies persistentes de preferências: até 1 ano.',
      'Cookies de análise: até 13 meses.',
      'Cookies de marketing: conforme definido por cada plataforma parceira.',
    ],
  },
  {
    title: 'Atualizações',
    content:
      'Esta Política pode ser atualizada para refletir mudanças em nossas práticas ou em requisitos legais. Recomendamos consultar esta página periodicamente.',
  },
  {
    title: 'Contato',
    content:
      'Para dúvidas sobre o uso de cookies, entre em contato: contato@bestsellers-ai.com.',
  },
]

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Como utilizamos cookies e tecnologias similares na Plataforma."
      lastUpdated="3 de março de 2026"
      sections={sections}
    />
  )
}
