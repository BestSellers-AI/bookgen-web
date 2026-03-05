import LegalLayout from '@/components/layout/LegalLayout'

export const metadata = {
  title: 'Política de Privacidade — Best Sellers AI',
  description: 'Saiba como a Best Sellers AI coleta, usa e protege seus dados pessoais.',
}

const sections = [
  {
    title: 'Introdução',
    content:
      'Esta Política de Privacidade descreve como a Best Sellers AI coleta, utiliza e protege suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.',
  },
  {
    title: 'Dados Coletados',
    content: [
      'Dados de cadastro: nome, e-mail e senha (armazenada de forma criptografada).',
      'Dados de pagamento: processados por gateway seguro (Stripe). Não armazenamos dados de cartão.',
      'Dados de uso: projetos criados, créditos utilizados, histórico de geração e preferências.',
      'Dados técnicos: endereço IP, tipo de navegador, sistema operacional e logs de acesso.',
      'Comunicações: e-mails de suporte e notificações trocados conosco.',
    ],
  },
  {
    title: 'Finalidade do Tratamento',
    content: [
      'Prestar e melhorar os serviços da Plataforma.',
      'Processar pagamentos e gerenciar assinaturas.',
      'Enviar comunicações transacionais (recibos, alertas de conta).',
      'Enviar comunicações de marketing, desde que você tenha optado por recebê-las.',
      'Cumprir obrigações legais e regulatórias.',
      'Prevenir fraudes e garantir a segurança da Plataforma.',
    ],
  },
  {
    title: 'Base Legal',
    content: [
      'Execução de contrato: para prestar os serviços contratados.',
      'Consentimento: para comunicações de marketing (revogável a qualquer momento).',
      'Obrigação legal: para cumprimento de requisitos fiscais e regulatórios.',
      'Legítimo interesse: para segurança, prevenção de fraudes e melhoria dos serviços.',
    ],
  },
  {
    title: 'Compartilhamento de Dados',
    content: [
      'Stripe: processamento de pagamentos.',
      'Amazon Web Services (AWS): infraestrutura de hospedagem.',
      'Provedores de IA: processamento de geração de conteúdo (dados enviados de forma anonimizada quando possível).',
      'Não vendemos nem alugamos seus dados pessoais a terceiros para fins de marketing.',
    ],
  },
  {
    title: 'Retenção de Dados',
    content:
      'Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento, os dados são anonimizados ou excluídos em até 90 dias, salvo obrigação legal de retenção por prazo maior.',
  },
  {
    title: 'Seus Direitos (LGPD)',
    content: [
      'Confirmação da existência de tratamento dos seus dados.',
      'Acesso aos dados que mantemos sobre você.',
      'Correção de dados incompletos, inexatos ou desatualizados.',
      'Anonimização, bloqueio ou exclusão de dados desnecessários.',
      'Portabilidade dos dados a outro fornecedor.',
      'Revogação do consentimento a qualquer momento.',
      'Para exercer seus direitos, entre em contato: contato@bestsellers-ai.com',
    ],
  },
  {
    title: 'Segurança',
    content:
      'Utilizamos criptografia TLS em trânsito, senhas com hash seguro e controles de acesso internos para proteger suas informações. Apesar de nossos esforços, nenhum sistema é 100% inviolável.',
  },
  {
    title: 'Cookies',
    content:
      'Utilizamos cookies para funcionamento da Plataforma, análise de uso e personalização. Consulte nossa Política de Cookies para detalhes.',
  },
  {
    title: 'Alterações nesta Política',
    content:
      'Podemos atualizar esta Política periodicamente. Notificaremos por e-mail em caso de mudanças relevantes. O uso continuado da Plataforma após as mudanças implica aceitação.',
  },
  {
    title: 'Contato e DPO',
    content:
      'Para questões sobre privacidade ou para exercer seus direitos, entre em contato: contato@bestsellers-ai.com.',
  },
]

export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais."
      lastUpdated="3 de março de 2026"
      sections={sections}
    />
  )
}
