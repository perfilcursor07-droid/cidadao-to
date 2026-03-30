import axios from 'axios';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';
const TSE_API = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

// ===================== TIPOS =====================

interface PoliticianData {
  name: string;
  role: 'governador' | 'senador' | 'dep_federal' | 'dep_estadual' | 'prefeito' | 'vereador';
  party: string;
  city: string;
  state: string;
  photo_url: string | null;
  bio: string | null;
  external_id?: string;
}

// ===================== CÂMARA DOS DEPUTADOS =====================

export async function fetchDeputadosFederaisTO(): Promise<PoliticianData[]> {
  try {
    const response = await axios.get(`${CAMARA_API}/deputados`, {
      params: {
        siglaUf: 'TO',
        itens: 50,
        ordem: 'ASC',
        ordenarPor: 'nome',
      },
      headers: { Accept: 'application/json' },
      timeout: 10000,
    });

    return response.data.dados.map((dep: any) => ({
      name: dep.nome,
      role: 'dep_federal' as const,
      party: dep.siglaPartido,
      city: 'Palmas',
      state: 'TO',
      photo_url: dep.urlFoto || null,
      bio: `Deputado(a) Federal pelo Tocantins - ${dep.siglaPartido}`,
      external_id: dep.id?.toString(),
    }));
  } catch (error) {
    console.error('[TSE Service] Erro ao buscar deputados federais:', error);
    return [];
  }
}


// ===================== SENADO FEDERAL =====================

export async function fetchSenadoresTO(): Promise<PoliticianData[]> {
  try {
    const response = await axios.get(`${SENADO_API}/senador/lista/atual`, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
    });

    const parlamentares =
      response.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];

    const senadoresTO = parlamentares.filter(
      (sen: any) => sen.IdentificacaoParlamentar?.UfParlamentar === 'TO'
    );

    return senadoresTO.map((sen: any) => {
      const id = sen.IdentificacaoParlamentar;
      return {
        name: id.NomeParlamentar,
        role: 'senador' as const,
        party: id.SiglaPartidoParlamentar,
        city: 'Palmas',
        state: 'TO',
        photo_url: id.UrlFotoParlamentar || null,
        bio: `Senador(a) pelo Tocantins - ${id.SiglaPartidoParlamentar}`,
        external_id: id.CodigoParlamentar,
      };
    });
  } catch (error) {
    console.error('[TSE Service] Erro ao buscar senadores:', error);
    return [];
  }
}

// ===================== TSE - PREFEITOS E VEREADORES =====================

// Códigos TSE dos principais municípios do Tocantins
const MUNICIPIOS_TO: Record<string, string> = {
  'Palmas': '92436',
  'Araguaína': '92037',
  'Gurupi': '92274',
  'Porto Nacional': '92622',
  'Paraíso do Tocantins': '92525',
  'Colinas do Tocantins': '92177',
  'Guaraí': '92258',
  'Tocantinópolis': '92789',
  'Dianópolis': '92215',
  'Augustinópolis': '92088',
};

async function fetchCandidatosEleitos(
  codigoMunicipio: string,
  codigoCargo: string // 11 = prefeito, 13 = vereador
): Promise<any[]> {
  try {
    const url = `${TSE_API}/candidatura/listar/2024/${codigoMunicipio}/${codigoCargo}/candidatos`;
    const response = await axios.get(url, { timeout: 10000 });

    const candidatos = response.data?.candidatos || [];
    // Filtra apenas eleitos
    return candidatos.filter(
      (c: any) =>
        c.descSituacaoTot === 'Eleito' ||
        c.descSituacaoTot === 'Eleito por QP' ||
        c.descSituacaoTot === 'Eleito por média'
    );
  } catch (error) {
    // API do TSE pode estar indisponível
    return [];
  }
}

export async function fetchPrefeitosTO(): Promise<PoliticianData[]> {
  const prefeitos: PoliticianData[] = [];

  for (const [cidade, codigo] of Object.entries(MUNICIPIOS_TO)) {
    const eleitos = await fetchCandidatosEleitos(codigo, '11');
    for (const c of eleitos) {
      prefeitos.push({
        name: formatName(c.nomeUrna || c.nome),
        role: 'prefeito',
        party: c.partido?.sigla || '',
        city: cidade,
        state: 'TO',
        photo_url: c.urlFoto || null,
        bio: `Prefeito(a) de ${cidade} - ${c.partido?.sigla || ''}`,
      });
    }
  }

  return prefeitos;
}

export async function fetchVereadoresTO(cidade?: string): Promise<PoliticianData[]> {
  const vereadores: PoliticianData[] = [];
  const municipios = cidade
    ? { [cidade]: MUNICIPIOS_TO[cidade] }
    : MUNICIPIOS_TO;

  for (const [nomeCidade, codigo] of Object.entries(municipios)) {
    if (!codigo) continue;
    const eleitos = await fetchCandidatosEleitos(codigo, '13');
    for (const c of eleitos) {
      vereadores.push({
        name: formatName(c.nomeUrna || c.nome),
        role: 'vereador',
        party: c.partido?.sigla || '',
        city: nomeCidade,
        state: 'TO',
        photo_url: c.urlFoto || null,
        bio: `Vereador(a) de ${nomeCidade} - ${c.partido?.sigla || ''}`,
      });
    }
  }

  return vereadores;
}

// ===================== DADOS ESTÁTICOS (sem API disponível) =====================

// Governador e vice - não existe API, dados manuais
export function getGovernadorTO(): PoliticianData[] {
  return [
    {
      name: 'Wanderlei Barbosa',
      role: 'governador',
      party: 'Republicanos',
      city: 'Palmas',
      state: 'TO',
      photo_url: null,
      bio: 'Governador do Estado do Tocantins (2023-2026). Vice-governador eleito em 2018, assumiu o governo em 2021.',
    },
  ];
}

// Deputados estaduais - ALETO não tem API REST
export function getDeputadosEstaduaisTO(): PoliticianData[] {
  return [
    { name: 'Júnior Geo', party: 'PSDB', city: 'Palmas' },
    { name: 'Léo Barbosa', party: 'Republicanos', city: 'Palmas' },
    { name: 'Ivory de Lira', party: 'PL', city: 'Porto Nacional' },
    { name: 'Gutierres Torquato', party: 'PDT', city: 'Gurupi' },
    { name: 'Jair Farias', party: 'MDB', city: 'Araguaína' },
    { name: 'Amélio Cayres', party: 'Republicanos', city: 'Palmas' },
    { name: 'Valderez Castelo Branco', party: 'PP', city: 'Colinas do Tocantins' },
    { name: 'Claudia Lelis', party: 'PV', city: 'Palmas' },
    { name: 'Eduardo do Dertins', party: 'PP', city: 'Palmas' },
    { name: 'Fabion Gomes', party: 'PL', city: 'Araguaína' },
    { name: 'Issam Saado', party: 'PL', city: 'Palmas' },
    { name: 'Jorge Frederico', party: 'PP', city: 'Palmas' },
    { name: 'Léo Barbosa', party: 'Republicanos', city: 'Palmas' },
    { name: 'Olyntho Neto', party: 'Republicanos', city: 'Palmas' },
    { name: 'Paulo Mourão', party: 'MDB', city: 'Palmas' },
    { name: 'Professor Júnior Geo', party: 'PSDB', city: 'Palmas' },
    { name: 'Rérisson do Povo', party: 'PSD', city: 'Araguaína' },
    { name: 'Ricardo Ayres', party: 'Republicanos', city: 'Gurupi' },
    { name: 'Rogério Freitas', party: 'PL', city: 'Palmas' },
    { name: 'Vanda Monteiro', party: 'PSD', city: 'Palmas' },
    { name: 'Vilmar de Oliveira', party: 'PL', city: 'Palmas' },
    { name: 'Zé Roberto', party: 'PP', city: 'Palmas' },
    { name: 'Elenil da Penha', party: 'MDB', city: 'Palmas' },
    { name: 'Ataídes Oliveira', party: 'Agir', city: 'Palmas' },
  ].map(dep => ({
    ...dep,
    role: 'dep_estadual' as const,
    state: 'TO',
    photo_url: null,
    bio: `Deputado(a) Estadual pelo Tocantins - ${dep.party}`,
  }));
}

// ===================== SYNC GERAL =====================

export async function fetchAllPoliticosTO() {
  console.log('[Sync] Buscando deputados federais...');
  const depFederais = await fetchDeputadosFederaisTO();

  console.log('[Sync] Buscando senadores...');
  const senadores = await fetchSenadoresTO();

  console.log('[Sync] Buscando prefeitos (TSE)...');
  const prefeitos = await fetchPrefeitosTO();

  console.log('[Sync] Buscando vereadores (TSE)...');
  const vereadores = await fetchVereadoresTO();

  const governador = getGovernadorTO();
  const depEstaduais = getDeputadosEstaduaisTO();

  return {
    governador,
    senadores,
    deputados_federais: depFederais,
    deputados_estaduais: depEstaduais,
    prefeitos,
    vereadores,
    resumo: {
      governador: governador.length,
      senadores: senadores.length,
      deputados_federais: depFederais.length,
      deputados_estaduais: depEstaduais.length,
      prefeitos: prefeitos.length,
      vereadores: vereadores.length,
    },
  };
}

// Placeholder original
export async function fetchPoliticianData(tseId: string) {
  try {
    console.log(`Buscando dados do TSE para ID: ${tseId}`);
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do TSE:', error);
    return null;
  }
}

// Formata nome de urna (MAIÚSCULO -> Capitalizado)
function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
