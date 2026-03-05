// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  text: string
  included: boolean
  soon?: boolean
}

export interface Plan {
  id: string
  name: string
  credits: number
  booksPerMonth: number
  monthlyPrice: number
  annualMonthlyPrice: number
  annualTotal: number
  popular: boolean
  badge?: string
  features: PlanFeature[]
  cta: string
  highlight?: string
}

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  popular: boolean
  label: string
  useCases: { emoji: string; text: string }[]
  features: PlanFeature[]
  cta: string
}

export interface Service {
  name: string
  credits: number
}

export interface CalculatorOption {
  label: string
  value: number
  recommendation: string
  recommendationLabel: string
}

export interface FAQItem {
  question: string
  answer: string
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'autor',
    name: 'Autor Aspirante',
    credits: 300,
    booksPerMonth: 3,
    monthlyPrice: 29,
    annualMonthlyPrice: 19,
    annualTotal: 228,
    popular: false,
    cta: 'Começar com Autor Aspirante',
    highlight: '1 livro + capa IA + tradução por menos de $20/mês',
    features: [
      { text: '300 créditos por mês', included: true },
      { text: 'Licença de uso pessoal', included: true },
      { text: 'Criação em 30+ idiomas', included: true },
      { text: 'Download: DOCX + PDF', included: true },
      { text: 'Editor de conteúdo', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte 24/7', included: true },
      { text: '1 regeneração gratuita por mês', included: true },
      { text: 'Histórico de projetos: 30 dias', included: true },
      { text: 'Fila de entrega padrão', included: true },
      { text: 'Créditos expiram todo mês', included: false },
    ],
  },
  {
    id: 'bestseller',
    name: 'Autor BestSeller',
    credits: 750,
    booksPerMonth: 7,
    monthlyPrice: 59,
    annualMonthlyPrice: 39,
    annualTotal: 468,
    popular: true,
    badge: 'Mais Popular',
    cta: 'Começar com Autor BestSeller',
    highlight: 'Publique, venda e use no seu negócio. Tudo incluso.',
    features: [
      { text: '750 créditos por mês', included: true },
      { text: 'Licença de uso COMERCIAL', included: true },
      { text: 'Criação em 30+ idiomas', included: true },
      { text: 'Download: DOCX + PDF', included: true },
      { text: 'Editor completo de conteúdo', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte 24/7', included: true },
      { text: '2 regenerações gratuitas por mês', included: true },
      { text: 'Histórico de projetos: 6 meses', included: true },
      { text: 'Fila de entrega PRIORITÁRIA', included: true },
      { text: '10% de desconto em publicações', included: true },
      { text: 'Créditos acumulam por 1 mês', included: true },
    ],
  },
  {
    id: 'editora',
    name: 'Autor Elite',
    credits: 2000,
    booksPerMonth: 20,
    monthlyPrice: 139,
    annualMonthlyPrice: 89,
    annualTotal: 1068,
    popular: false,
    cta: 'Começar com Autor Elite',
    highlight: 'Escala profissional. 2.000 créditos que não expiram por 3 meses.',
    features: [
      { text: '2.000 créditos por mês', included: true },
      { text: 'Licença de uso COMERCIAL', included: true },
      { text: 'Criação em 30+ idiomas', included: true },
      { text: 'Download: DOCX + PDF', included: true },
      { text: 'Editor completo de conteúdo', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte humano prioritário', included: true },
      { text: '5 regenerações por mês', included: true },
      { text: 'Histórico de projetos ilimitado', included: true },
      { text: 'Fila de entrega EXPRESS', included: true },
      { text: '15% de desconto em publicações', included: true },
      { text: 'Créditos acumulam por 3 meses', included: true },
    ],
  },
]

// ─── Credit Packs ─────────────────────────────────────────────────────────────

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'solo',
    name: 'Obra Aspirante',
    credits: 100,
    price: 19,
    popular: false,
    label: 'Para experimentar',
    cta: 'Comprar Obra Aspirante',
    useCases: [
      { emoji: '📖', text: '1 livro completo, OU' },
      { emoji: '🌐', text: '1 tradução completa do livro' },
    ],
    features: [
      { text: 'Créditos sem prazo de validade', included: true },
      { text: 'Licença de uso pessoal', included: true },
      { text: 'Download DOCX + PDF', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte 24/7', included: true },
    ],
  },
  {
    id: 'pack',
    name: 'Obra Completa',
    credits: 400,
    price: 69,
    popular: true,
    label: '1 projeto editorial completo',
    cta: 'Comprar Obra Completa',
    useCases: [
      { emoji: '📖', text: 'Livro completo (100cr)' },
      { emoji: '🎨', text: 'Capa IA — 6 variações (150cr)' },
      { emoji: '🖼️', text: 'Pack de imagens (150cr)' },
    ],
    features: [
      { text: 'Créditos sem prazo de validade', included: true },
      { text: 'Licença de uso pessoal', included: true },
      { text: 'Download DOCX + PDF', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte 24/7', included: true },
    ],
  },
  {
    id: 'bundle',
    name: 'BestSeller Mundial',
    credits: 1500,
    price: 249,
    popular: false,
    label: 'Para publicar na Amazon',
    cta: 'Comprar BestSeller Mundial',
    useCases: [
      { emoji: '📖', text: '1 Livro completo (100cr)' },
      { emoji: '🎨', text: '1 Capa IA personalizada (150cr)' },
      { emoji: '🌍', text: 'Publicação BestSeller Mundial — Amazon + Outras (1.000cr)' },
    ],
    features: [
      { text: 'Créditos sem prazo de validade', included: true },
      { text: 'Licença de uso COMERCIAL', included: true },
      { text: 'Download DOCX + PDF', included: true },
      { text: 'Criação de imagens e mídias', included: true },
      { text: 'Gerador de Audiobook', included: true },
      { text: 'Editor de conteúdo completo', included: true },
      { text: 'Compartilhamento com 1 clique', included: true },
      { text: 'Suporte 24/7', included: true },
    ],
  },
]

// ─── Services ─────────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  { name: 'Livro completo (~30K palavras)', credits: 100 },
  { name: 'Capa IA (6 variações)', credits: 150 },
  { name: 'Tradução do livro', credits: 100 },
  { name: 'Tradução da capa (regeneração)', credits: 150 },
  { name: 'Pack de imagens internas (10 imgs)', credits: 150 },
  { name: 'Publicação Standard', credits: 700 },
  { name: 'Publicação Premium', credits: 1000 },
]

// ─── Calculator ───────────────────────────────────────────────────────────────

export const CALCULATOR_OPTIONS: CalculatorOption[] = [
  { label: '1 livro', value: 1, recommendation: 'autor', recommendationLabel: 'Autor Aspirante' },
  { label: '2–3 livros', value: 3, recommendation: 'autor', recommendationLabel: 'Autor Aspirante' },
  { label: '4–7 livros', value: 7, recommendation: 'bestseller', recommendationLabel: 'Autor BestSeller' },
  { label: '8 ou mais', value: 8, recommendation: 'editora', recommendationLabel: 'Autor Elite' },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Preciso saber escrever para usar a plataforma?',
    answer:
      'Não. Você não escreve uma única palavra. Basta descrever sua ideia — tema, público, estilo — e nossa IA cria o livro completo por você. É como ter um ghostwriter profissional disponível 24/7.',
  },
  {
    question: 'Em quanto tempo meu livro fica pronto?',
    answer:
      'Em menos de 1 hora. Do zero ao livro completo com 30.000+ palavras, estruturado e revisado. Se quiser capa personalizada e tradução, adicione mais 10–15 minutos.',
  },
  {
    question: 'Os direitos autorais são 100% meus?',
    answer:
      'Sim. Você é o autor e proprietário total do conteúdo gerado. A Best Sellers AI não reivindica nenhum direito sobre seu livro. Você pode publicar, vender e distribuir como quiser.',
  },
  {
    question: 'Os créditos expiram?',
    answer:
      'Na compra avulsa, seus créditos nunca expiram. Nas assinaturas: Autor Aspirante (créditos expiram todo mês), Autor BestSeller (créditos acumulam por 1 mês) e Autor Elite (créditos acumulam por 3 meses).',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim. Sem multa, sem perguntas. Você pode cancelar sua assinatura a qualquer momento pelo painel, com efeito imediato.',
  },
  {
    question: 'Posso usar o conteúdo gerado comercialmente?',
    answer:
      'A partir do plano Autor BestSeller e no BestSeller Mundial, você tem licença de uso comercial completa — pode publicar, vender e usar o conteúdo no seu negócio.',
  },
  {
    question: 'A plataforma funciona em outros idiomas?',
    answer: 'Sim. Suportamos criação e tradução em 30+ idiomas, incluindo português, espanhol, inglês, francês, alemão e muito mais.',
  },
  {
    question: 'A capa do meu livro é realmente única?',
    answer:
      'Sim. Geramos 6 variações de capa exclusivas para o seu livro usando modelos de geração de imagem de última geração. Cada capa é criada especificamente para o seu título.',
  },
  {
    question: 'A publicação na Amazon está inclusa nos planos?',
    answer:
      'A publicação é um serviço especializado cobrado à parte em créditos. No plano Standard (700 créditos), nossa equipe cuida de tudo: formatação profissional em eBook (EPUB) e livro impresso (PDF), publicação direta na Amazon KDP, configuração estratégica de preço, registro de ISBN e ficha catalográfica, além de suporte completo para ajustes — com prazo garantido de 10 dias úteis. O plano BestSeller Mundial (1.000 créditos) vai além: além de tudo do Standard, seu livro é distribuído também na Kobo e Draft2Digital, recebe formatação premium com design de miolo e inclusão de imagens, otimização de SEO para aparecer nas buscas da Amazon, e você ainda tem acesso a um curso completo de marketing e lançamento — com acompanhamento prioritário via WhatsApp do início ao fim.',
  },
  {
    question: 'Posso criar e ver meu livro gratuitamente?',
    answer:
      'Sim. Você pode criar seu projeto e visualizar prévias do seu livro gratuitamente, sem cartão de crédito. Para gerar e baixar a versão final, você precisará de créditos.',
  },
]
