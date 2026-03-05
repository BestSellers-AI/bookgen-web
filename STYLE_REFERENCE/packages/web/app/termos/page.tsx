import LegalLayout from '@/components/layout/LegalLayout'

export const metadata = {
  title: 'Termos de Uso — Best Sellers AI',
  description: 'Leia os Termos de Uso da plataforma Best Sellers AI.',
}

const sections = [
  {
    title: 'Aceitação dos Termos',
    content:
      'Ao acessar ou utilizar a plataforma Best Sellers AI ("Plataforma"), você concorda com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize a Plataforma. Reservamo-nos o direito de atualizar estes termos periodicamente, com aviso prévio por e-mail ou notificação na Plataforma.',
  },
  {
    title: 'Descrição do Serviço',
    content:
      'A Best Sellers AI fornece ferramentas de geração de conteúdo baseadas em inteligência artificial para criação, personalização e publicação de livros digitais e físicos. Os serviços incluem geração de texto, criação de capas, tradução, audiobooks e publicação na Amazon KDP, conforme o plano contratado.',
  },
  {
    title: 'Cadastro e Conta',
    content: [
      'Você deve ter pelo menos 18 anos para criar uma conta.',
      'As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.',
      'Você é responsável pela confidencialidade da sua senha e por todas as atividades realizadas na sua conta.',
      'Notifique-nos imediatamente em caso de uso não autorizado da sua conta.',
    ],
  },
  {
    title: 'Planos, Créditos e Pagamentos',
    content: [
      'Os planos de assinatura são cobrados mensalmente ou anualmente, conforme escolha no momento da contratação.',
      'Créditos adquiridos em pacotes avulsos não expiram. Créditos de assinatura seguem as regras do plano contratado.',
      'Não realizamos reembolso de créditos já utilizados ou de períodos parciais de assinatura.',
      'O cancelamento da assinatura pode ser feito a qualquer momento pelo painel, com efeito no próximo ciclo de cobrança.',
      'Os preços podem ser alterados com aviso prévio de 30 dias.',
    ],
  },
  {
    title: 'Propriedade Intelectual e Licença de Uso',
    content: [
      'O conteúdo gerado pela Plataforma é de sua propriedade, sujeito ao tipo de licença do seu plano.',
      'Planos com licença pessoal permitem uso para fins não comerciais. Planos com licença comercial permitem publicação, venda e uso em negócios.',
      'A Best Sellers AI não reivindica direitos autorais sobre o conteúdo gerado para você.',
      'A tecnologia, design e código da Plataforma são de propriedade exclusiva da Best Sellers AI.',
    ],
  },
  {
    title: 'Uso Aceitável',
    content: [
      'É proibido usar a Plataforma para gerar conteúdo ilegal, ofensivo, difamatório, fraudulento ou que viole direitos de terceiros.',
      'É proibido tentar contornar limitações técnicas, fazer engenharia reversa ou comprometer a segurança da Plataforma.',
      'É proibido utilizar scripts automatizados para abusar dos serviços ou sobrecarregar os sistemas.',
      'A violação destas regras pode resultar na suspensão ou encerramento imediato da conta.',
    ],
  },
  {
    title: 'Serviço de Publicação na Amazon',
    content:
      'O serviço de publicação é realizado pela equipe especializada da Best Sellers AI e cobrado separadamente em créditos. Os prazos de publicação dependem do processo de revisão da Amazon KDP, sobre o qual não temos controle direto. A aprovação final é responsabilidade da Amazon.',
  },
  {
    title: 'Limitação de Responsabilidade',
    content:
      'A Best Sellers AI não garante que o conteúdo gerado estará livre de erros, inconsistências ou que atenderá a todos os requisitos de publicação. Recomendamos a revisão humana antes da publicação. Nossa responsabilidade máxima se limita ao valor pago nos últimos 3 meses de serviço.',
  },
  {
    title: 'Lei Aplicável',
    content:
      'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo, SP, para dirimir quaisquer controvérsias.',
  },
  {
    title: 'Contato',
    content:
      'Para dúvidas sobre estes Termos, entre em contato pelo e-mail contato@bestsellers-ai.com.',
  },
]

export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="Por favor, leia atentamente antes de utilizar a plataforma."
      lastUpdated="3 de março de 2026"
      sections={sections}
    />
  )
}
