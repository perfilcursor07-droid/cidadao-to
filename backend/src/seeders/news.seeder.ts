import News from '../models/News';

const newsData = [
  {
    title: 'Tocantins registra recorde de exportações no agronegócio em 2026',
    summary: 'Estado ultrapassou a marca de R$ 12 bilhões em exportações agrícolas no primeiro trimestre, puxado pela soja e pecuária.',
    content: `<p>O Tocantins alcançou um marco histórico nas exportações do agronegócio. Segundo dados da Secretaria de Agricultura, o estado exportou R$ 12,3 bilhões apenas no primeiro trimestre de 2026.</p>
<p>A soja continua sendo o principal produto, representando 45% do total exportado, seguida pela carne bovina (28%) e milho (15%). Os principais destinos são China, União Europeia e países do Oriente Médio.</p>
<p>"Esse resultado reflete o investimento em infraestrutura logística e a competitividade do produtor tocantinense", afirmou o secretário de Agricultura.</p>
<h3>Números do trimestre</h3>
<ul>
<li>Soja: R$ 5,5 bilhões (+18% vs 2025)</li>
<li>Carne bovina: R$ 3,4 bilhões (+12%)</li>
<li>Milho: R$ 1,8 bilhão (+22%)</li>
<li>Outros: R$ 1,6 bilhão</li>
</ul>
<p>O governador Wanderlei Barbosa destacou que a meta é atingir R$ 50 bilhões em exportações até o final do ano, o que representaria um crescimento de 25% em relação a 2025.</p>`,
    category: 'Economia',
    featured: true,
    published: true,
    cover_emoji: '📈',
    cover_color: '#E8F5E9',
    cover_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-28'),
  },
  {
    title: 'Assembleia aprova lei de transparência digital para municípios',
    summary: 'Nova legislação obriga todas as prefeituras do TO a publicarem gastos em tempo real em portal digital até 2027.',
    content: `<p>A Assembleia Legislativa do Tocantins aprovou por unanimidade o Projeto de Lei que obriga todos os 139 municípios do estado a manterem portais de transparência digital atualizados em tempo real.</p>
<p>A lei estabelece prazo de 18 meses para adequação e prevê penalidades para gestores que não cumprirem as exigências. Entre as obrigações estão a publicação de contratos, licitações, folha de pagamento e execução orçamentária.</p>
<p>"É um avanço fundamental para a democracia tocantinense. O cidadão tem direito de saber como seu dinheiro está sendo gasto", disse a deputada Dorinha Seabra, relatora do projeto.</p>`,
    category: 'Política',
    featured: false,
    published: true,
    cover_emoji: '🏛️',
    cover_color: '#E3F2FD',
    cover_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-27'),
  },
  {
    title: 'Hospital Regional de Araguaína atinge 45% de conclusão',
    summary: 'Obra do maior hospital do norte do estado avança e deve ser entregue no segundo semestre de 2027.',
    content: `<p>As obras do Hospital Regional de Araguaína atingiram 45% de execução, segundo relatório da Secretaria de Infraestrutura. O hospital terá 300 leitos, centro cirúrgico de alta complexidade e UTI neonatal.</p>
<p>O investimento total é de R$ 280 milhões, com recursos federais e estaduais. A previsão de entrega é para o segundo semestre de 2027.</p>
<p>O hospital atenderá uma população estimada de 1,2 milhão de pessoas da região norte do Tocantins e sul do Maranhão.</p>`,
    category: 'Saúde',
    featured: false,
    published: true,
    cover_emoji: '🏥',
    cover_color: '#FFEBEE',
    cover_url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-26'),
  },
  {
    title: 'Programa de energia solar já atende 120 escolas no Tocantins',
    summary: 'Iniciativa do governo estadual reduz em 40% os custos de energia das escolas beneficiadas.',
    content: `<p>O Programa Tocantins Solar já instalou painéis fotovoltaicos em 120 escolas da rede estadual, superando a meta intermediária de 100 unidades. A economia média é de 40% na conta de energia.</p>
<p>O programa prevê atingir 200 escolas até o final de 2025, com investimento total de R$ 45 milhões. Além da economia, as escolas servem como laboratório de educação ambiental para os alunos.</p>`,
    category: 'Educação',
    featured: false,
    published: true,
    cover_emoji: '☀️',
    cover_color: '#FFF8E1',
    cover_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-25'),
  },
  {
    title: 'Palmas sobe 15 posições no ranking de cidades inteligentes',
    summary: 'Capital tocantinense é destaque em digitalização de serviços públicos e mobilidade urbana sustentável.',
    content: `<p>Palmas subiu 15 posições no ranking Connected Smart Cities 2026, alcançando a 42ª posição entre as cidades brasileiras. Os destaques foram nas categorias de tecnologia e inovação, mobilidade e meio ambiente.</p>
<p>O programa de Wi-Fi gratuito em praças e a digitalização dos serviços municipais foram citados como diferenciais pela organização do ranking.</p>`,
    category: 'Tecnologia',
    featured: false,
    published: true,
    cover_emoji: '🌆',
    cover_color: '#E3F2FD',
    cover_url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-24'),
  },
  {
    title: 'Operação do MP investiga desvios em licitações de Gurupi',
    summary: 'Ministério Público apura irregularidades em contratos de pavimentação que somam R$ 18 milhões.',
    content: `<p>O Ministério Público do Tocantins deflagrou operação para investigar possíveis irregularidades em licitações de pavimentação na cidade de Gurupi. Os contratos sob investigação somam R$ 18 milhões.</p>
<p>Segundo o MP, há indícios de superfaturamento e direcionamento de licitações. Cinco servidores foram afastados preventivamente.</p>`,
    category: 'Investigação',
    featured: false,
    published: true,
    cover_emoji: '🔍',
    cover_color: '#FFEBEE',
    cover_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-23'),
  },
  {
    title: 'Tocantins terá primeiro parque tecnológico do Norte do Brasil',
    summary: 'Investimento de R$ 150 milhões criará hub de inovação em Palmas com foco em agritech e govtech.',
    content: `<p>O governador anunciou a criação do primeiro parque tecnológico da região Norte, que será instalado em Palmas com investimento de R$ 150 milhões.</p>
<p>O espaço terá foco em agritech, govtech e energias renováveis, com previsão de gerar 2.000 empregos diretos nos primeiros três anos de operação.</p>`,
    category: 'Tecnologia',
    featured: false,
    published: true,
    cover_emoji: '🚀',
    cover_color: '#E8F5E9',
    cover_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-22'),
  },
  {
    title: 'Índice de desmatamento no Tocantins cai 22% em relação a 2025',
    summary: 'Monitoramento por satélite mostra redução significativa, mas cerrado ainda enfrenta pressão do agronegócio.',
    content: `<p>Dados do INPE mostram que o desmatamento no Tocantins caiu 22% no primeiro trimestre de 2026 em comparação com o mesmo período de 2025. A área desmatada foi de 450 km², contra 577 km² no ano anterior.</p>
<p>Especialistas atribuem a redução ao aumento da fiscalização e às novas tecnologias de monitoramento por satélite implementadas pelo governo estadual.</p>`,
    category: 'Meio Ambiente',
    featured: false,
    published: true,
    cover_emoji: '🌳',
    cover_color: '#E8F5E9',
    cover_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
    published_at: new Date('2026-03-21'),
  },
];

export async function seedNews() {
  for (const data of newsData) {
    const [record, created] = await News.findOrCreate({ where: { title: data.title }, defaults: data });
    if (!created && !record.cover_url) {
      await record.update({ cover_url: data.cover_url });
    }
  }
  console.log(`Seed de notícias concluído: ${newsData.length} registros.`);
}
