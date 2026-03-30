import PromiseModel from '../models/Promise';
import Politician from '../models/Politician';

interface PromiseSeed {
  politicianName: string;
  title: string;
  description: string;
  area: string;
  status: 'pending' | 'progress' | 'done' | 'failed';
  progress_pct: number;
  deadline?: string;
}

const promisesData: PromiseSeed[] = [
  // Wanderlei Barbosa - Governador
  { politicianName: 'Wanderlei Barbosa', title: 'Pavimentação de 500km de estradas rurais', description: 'Programa de infraestrutura para conectar comunidades rurais do Tocantins com asfalto de qualidade.', area: 'Infraestrutura', status: 'progress', progress_pct: 35, deadline: '2026-12-31' },
  { politicianName: 'Wanderlei Barbosa', title: 'Construção de 10 novas escolas estaduais', description: 'Expansão da rede de ensino estadual em municípios do interior com escolas de tempo integral.', area: 'Educação', status: 'pending', progress_pct: 10, deadline: '2026-06-30' },
  { politicianName: 'Wanderlei Barbosa', title: 'Programa de energia solar para escolas públicas', description: 'Instalação de painéis solares em 200 escolas da rede estadual para reduzir custos e promover sustentabilidade.', area: 'Energia', status: 'progress', progress_pct: 60, deadline: '2025-12-31' },
  { politicianName: 'Wanderlei Barbosa', title: 'Hospital Regional de Araguaína', description: 'Construção do novo hospital regional com 300 leitos e centro cirúrgico de alta complexidade.', area: 'Saúde', status: 'progress', progress_pct: 45, deadline: '2027-06-30' },
  { politicianName: 'Wanderlei Barbosa', title: 'Programa Tocantins Sem Fome', description: 'Distribuição de cestas básicas e criação de cozinhas comunitárias em 50 municípios.', area: 'Assistência Social', status: 'done', progress_pct: 100 },
  { politicianName: 'Wanderlei Barbosa', title: 'Ferrovia Norte-Sul: ramal Palmas-Belém', description: 'Articulação federal para extensão da ferrovia até o porto de Belém, beneficiando exportações do agro.', area: 'Infraestrutura', status: 'failed', progress_pct: 5 },

  // Cinthia Ribeiro - Prefeita de Palmas
  { politicianName: 'Cinthia Ribeiro', title: 'Revitalização da Praia da Graciosa', description: 'Reforma completa da área de lazer com novo calçadão, iluminação LED e espaço gastronômico.', area: 'Lazer', status: 'done', progress_pct: 100 },
  { politicianName: 'Cinthia Ribeiro', title: 'Expansão do BRT de Palmas', description: 'Novas linhas de transporte rápido conectando Taquaralto ao Plano Diretor com 15 estações.', area: 'Transporte', status: 'pending', progress_pct: 5, deadline: '2027-12-31' },
  { politicianName: 'Cinthia Ribeiro', title: 'Wi-Fi gratuito em praças públicas', description: 'Instalação de internet gratuita em 30 praças e espaços públicos da capital.', area: 'Tecnologia', status: 'done', progress_pct: 100 },
  { politicianName: 'Cinthia Ribeiro', title: 'Programa Palmas Solar', description: 'Instalação de usinas solares em prédios públicos municipais para economia de energia.', area: 'Energia', status: 'progress', progress_pct: 70, deadline: '2026-06-30' },
  { politicianName: 'Cinthia Ribeiro', title: 'Creches 24 horas', description: 'Abertura de 5 creches com funcionamento noturno para mães trabalhadoras.', area: 'Educação', status: 'failed', progress_pct: 15 },

  // Dorinha Seabra - Dep. Federal
  { politicianName: 'Dorinha Seabra', title: 'Novo FUNDEB com mais recursos para o TO', description: 'Aprovação do novo FUNDEB com aumento de 15% nos repasses para o Tocantins.', area: 'Educação', status: 'done', progress_pct: 100 },
  { politicianName: 'Dorinha Seabra', title: 'Universidade Federal do Norte do Tocantins', description: 'Projeto de lei para criação de campus universitário federal em Araguaína.', area: 'Educação', status: 'progress', progress_pct: 40, deadline: '2027-12-31' },
  { politicianName: 'Dorinha Seabra', title: 'Programa de alfabetização digital', description: 'Distribuição de tablets e capacitação digital para 10.000 alunos da rede pública.', area: 'Educação', status: 'progress', progress_pct: 55 },

  // Eduardo Gomes - Senador
  { politicianName: 'Eduardo Gomes', title: 'Ponte sobre o Rio Tocantins em Porto Nacional', description: 'Nova ponte rodoviária para desafogar o tráfego e conectar as margens do rio.', area: 'Infraestrutura', status: 'progress', progress_pct: 25, deadline: '2028-12-31' },
  { politicianName: 'Eduardo Gomes', title: 'Zona Franca de Palmas', description: 'Projeto de lei para criação de zona de incentivos fiscais na capital tocantinense.', area: 'Economia', status: 'pending', progress_pct: 8 },
  { politicianName: 'Eduardo Gomes', title: 'Duplicação da TO-010', description: 'Emenda para duplicação da rodovia entre Palmas e Paraíso do Tocantins.', area: 'Infraestrutura', status: 'progress', progress_pct: 30 },

  // Wagner Rodrigues - Prefeito de Araguaína
  { politicianName: 'Wagner Rodrigues', title: 'UPAs 24h nos bairros periféricos', description: 'Construção de 3 Unidades de Pronto Atendimento em bairros carentes de Araguaína.', area: 'Saúde', status: 'progress', progress_pct: 65, deadline: '2026-06-30' },
  { politicianName: 'Wagner Rodrigues', title: 'Parque Linear do Córrego Canindé', description: 'Revitalização ambiental e criação de área de lazer ao longo do córrego.', area: 'Meio Ambiente', status: 'done', progress_pct: 100 },
  { politicianName: 'Wagner Rodrigues', title: 'Programa Araguaína Digital', description: 'Digitalização de todos os serviços municipais com app para o cidadão.', area: 'Tecnologia', status: 'progress', progress_pct: 80 },

  // Irajá Abreu - Senador
  { politicianName: 'Irajá Abreu', title: 'Seguro rural para pequenos produtores', description: 'Projeto de lei para subsidiar seguro agrícola de pequenos produtores do Tocantins.', area: 'Agricultura', status: 'pending', progress_pct: 12 },
  { politicianName: 'Irajá Abreu', title: 'Ferrovia de integração do agro tocantinense', description: 'Articulação para ramal ferroviário conectando regiões produtoras aos portos.', area: 'Infraestrutura', status: 'failed', progress_pct: 3 },

  // Amália Santana - Vereadora
  { politicianName: 'Amália Santana', title: 'Casa da Mulher Tocantinense', description: 'Centro de acolhimento e apoio jurídico para mulheres vítimas de violência doméstica.', area: 'Assistência Social', status: 'done', progress_pct: 100 },
  { politicianName: 'Amália Santana', title: 'Programa Mãe Palmense', description: 'Auxílio financeiro mensal para mães solo em situação de vulnerabilidade.', area: 'Assistência Social', status: 'progress', progress_pct: 75 },

  // Diogo Fernandes - Vereador
  { politicianName: 'Diogo Fernandes', title: 'Palmas Tech Hub', description: 'Criação de espaço de coworking e incubadora de startups com apoio municipal.', area: 'Tecnologia', status: 'progress', progress_pct: 50, deadline: '2026-12-31' },
  { politicianName: 'Diogo Fernandes', title: 'Transparência total: portal de dados abertos', description: 'Portal municipal com todos os gastos, contratos e licitações em tempo real.', area: 'Transparência', status: 'done', progress_pct: 100 },
];

export async function seedPromises() {
  for (const data of promisesData) {
    const politician = await Politician.findOne({ where: { name: data.politicianName } });
    if (!politician) {
      console.log(`Político não encontrado: ${data.politicianName}`);
      continue;
    }
    await PromiseModel.findOrCreate({
      where: { title: data.title },
      defaults: {
        politician_id: politician.id,
        title: data.title,
        description: data.description,
        area: data.area,
        status: data.status,
        progress_pct: data.progress_pct,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
  }
  console.log(`Seed de promessas concluído: ${promisesData.length} registros.`);
}
