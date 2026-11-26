// Simulação inteligente de dados de alimentação e hidratação do Mingau
// Inclui detecção de desvio de rotina / anomalia de saúde

export const MINGAU_BASE_INFO = {
  id: 2,
  nome: 'Mingau',
  foto_url: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg',
  raca: 'Angorá Branco',
  peso: 4.3,
  rotinaPadrao: {
    aguaVezesDia: 2.5,
    aguaMlDia: 140,
    racaoVezesDia: 3.5,
    racaoGramasDia: 58
  }
};

// Cenário 1: ANOMALIA CRÍTICA (2 dias sem tomar água)
export const DADOS_CENARIO_ANOMALIA = {
  nomeCenario: 'Anomalia Crítica (2 dias sem água)',
  temAlerta: true,
  alerta: {
    nivel: 'critico', // 'critico' | 'atencao' | 'normal'
    titulo: '🚨 Alerta Crítico: 48h sem Consumo de Água!',
    mensagem: 'Mingau não bebe água há 2 dias (rotina normal: 2 a 3 vezes ao dia, ~140 ml). Queda drástica de 100% no consumo hídrico.',
    risco: 'Risco iminente de desidratação severa, infecção urinária e sobrecarga renal.',
    recomendacao: 'Ofereça sachê úmido imediatamente e procure o médico veterinário se o comportamento persistir.',
    diasSemAgua: 2,
    ultimaVezAgua: 'Há 46 horas (Sábado às 15:20)'
  },
  graficoAgua: [
    { dia: 'Seg', valor: 150, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Ter', valor: 140, vezes: 2, normal: 140, status: 'normal' },
    { dia: 'Qua', valor: 160, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Qui', valor: 135, vezes: 2, normal: 140, status: 'normal' },
    { dia: 'Sex', valor: 145, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Sáb', valor: 10,  vezes: 1, normal: 140, status: 'anomalia', desc: 'Apenas lambida superficial (10 ml)' },
    { dia: 'Dom (Hoje)', valor: 0, vezes: 0, normal: 140, status: 'critico', desc: 'Nenhum consumo registrado (0 ml)' }
  ],
  graficoRacao: [
    { dia: 'Seg', valor: 58, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Ter', valor: 55, vezes: 3, normal: 55, status: 'normal' },
    { dia: 'Qua', valor: 62, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Qui', valor: 54, vezes: 3, normal: 55, status: 'normal' },
    { dia: 'Sex', valor: 56, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Sáb', valor: 38, vezes: 2, normal: 55, status: 'atencao', desc: 'Queda de apetite decorrente de desidratação' },
    { dia: 'Dom (Hoje)', valor: 35, vezes: 2, normal: 55, status: 'atencao', desc: 'Apenas 35g consumidas hoje' }
  ],
  metricas: {
    aguaHoje: 0,
    aguaMediaSemana: 105,
    quedaAguaPct: -100,
    racaoHoje: 35,
    racaoMediaSemana: 51,
    visitasHoje: 2,
    visitasMedia: 6
  },
  timeline: [
    {
      id: 'e1',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Hoje às 12:40',
      quantidade: '-18g',
      duracao: '48 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e2',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Hoje às 07:15',
      quantidade: '-17g',
      duracao: '35 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e3',
      tipo: 'alerta',
      titulo: '⚠️ Janela Hídrica Perdida',
      horario: 'Hoje às 06:30',
      quantidade: '0 ml',
      duracao: '0s',
      status: 'critico',
      statusTexto: 'Ausência de ingestão matinal esperada',
      foto: null
    },
    {
      id: 'e4',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Ontem às 20:30',
      quantidade: '-20g',
      duracao: '50 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e5',
      tipo: 'agua',
      titulo: '💧 Visita Anômala à Água',
      horario: 'Ontem às 15:20 (Há 46h)',
      quantidade: '-10 ml',
      duracao: '6 segundos',
      status: 'anomalia',
      statusTexto: 'Visita muito curta (apenas lambida rápida)',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e6',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Ontem às 08:00',
      quantidade: '-18g',
      duracao: '42 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e7',
      tipo: 'agua',
      titulo: 'Hidratação - Água Fresca',
      horario: 'Sexta às 22:15',
      quantidade: '-50 ml',
      duracao: '1 min 10s',
      status: 'normal',
      statusTexto: 'Ingestão saudável',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e8',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Sexta às 18:40',
      quantidade: '-22g',
      duracao: '55 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e9',
      tipo: 'agua',
      titulo: 'Hidratação - Água Fresca',
      horario: 'Sexta às 13:00',
      quantidade: '-45 ml',
      duracao: '58 segundos',
      status: 'normal',
      statusTexto: 'Ingestão saudável',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'e10',
      tipo: 'agua',
      titulo: 'Hidratação - Água Fresca',
      horario: 'Sexta às 07:10',
      quantidade: '-50 ml',
      duracao: '1 min 05s',
      status: 'normal',
      statusTexto: 'Ingestão saudável',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    }
  ]
};

// Cenário 2: ROTINA 100% NORMAL (Saudável)
export const DADOS_CENARIO_NORMAL = {
  nomeCenario: 'Rotina Normal e Saudável',
  temAlerta: false,
  alerta: {
    nivel: 'normal',
    titulo: '✅ Rotina Saudável: Mingau está 100% equilibrado!',
    mensagem: 'Todas as ingestões de água e ração dos últimos 7 dias estão dentro dos padrões ideais para o porte do Mingau.',
    risco: 'Nenhum risco detectado. Parâmetros metabólicos normais.',
    recomendacao: 'Continue mantendo a água limpa e fresca no reservatório.',
    diasSemAgua: 0,
    ultimaVezAgua: 'Hoje às 11:45 (Há 1h30)'
  },
  graficoAgua: [
    { dia: 'Seg', valor: 150, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Ter', valor: 140, vezes: 2, normal: 140, status: 'normal' },
    { dia: 'Qua', valor: 160, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Qui', valor: 135, vezes: 2, normal: 140, status: 'normal' },
    { dia: 'Sex', valor: 145, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Sáb', valor: 140, vezes: 3, normal: 140, status: 'normal' },
    { dia: 'Dom (Hoje)', valor: 145, vezes: 3, normal: 140, status: 'normal', desc: '145 ml consumidos (3 ingestões)' }
  ],
  graficoRacao: [
    { dia: 'Seg', valor: 58, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Ter', valor: 55, vezes: 3, normal: 55, status: 'normal' },
    { dia: 'Qua', valor: 62, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Qui', valor: 54, vezes: 3, normal: 55, status: 'normal' },
    { dia: 'Sex', valor: 56, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Sáb', valor: 58, vezes: 4, normal: 55, status: 'normal' },
    { dia: 'Dom (Hoje)', valor: 55, vezes: 3, normal: 55, status: 'normal', desc: '55g consumidas hoje' }
  ],
  metricas: {
    aguaHoje: 145,
    aguaMediaSemana: 145,
    quedaAguaPct: 0,
    racaoHoje: 55,
    racaoMediaSemana: 57,
    visitasHoje: 6,
    visitasMedia: 6
  },
  timeline: [
    {
      id: 'n1',
      tipo: 'agua',
      titulo: 'Hidratação - Água Fresca',
      horario: 'Hoje às 11:45',
      quantidade: '-48 ml',
      duracao: '1 min 02s',
      status: 'normal',
      statusTexto: 'Ingestão perfeita',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'n2',
      tipo: 'racao',
      titulo: 'Refeição - Ração Seca',
      horario: 'Hoje às 08:30',
      quantidade: '-20g',
      duracao: '45 segundos',
      status: 'normal',
      statusTexto: 'Consumo normal',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    },
    {
      id: 'n3',
      tipo: 'agua',
      titulo: 'Hidratação - Água Fresca',
      horario: 'Hoje às 06:50',
      quantidade: '-50 ml',
      duracao: '55 segundos',
      status: 'normal',
      statusTexto: 'Ingestão perfeita',
      foto: 'http://62.171.175.197:9090/felis/gatos/gato_2_1795625258087_157.jpg'
    }
  ]
};
