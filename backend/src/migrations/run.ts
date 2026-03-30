import { sequelize } from '../config/database';
import { up as createUsers } from './001_create_users';
import { up as createPoliticians } from './002_create_politicians';
import { up as createPromises } from './003_create_promises';
import { up as createVotes } from './004_create_votes';
import { up as createRatings } from './005_create_ratings';
import { up as createNews } from './006_create_news';
import { up as createDiario } from './007_create_diario_analyses';
import { up as addCoverUrl } from './008_add_cover_url_to_news';

const migrations = [
  { name: '001_create_users', fn: createUsers },
  { name: '002_create_politicians', fn: createPoliticians },
  { name: '003_create_promises', fn: createPromises },
  { name: '004_create_votes', fn: createVotes },
  { name: '005_create_ratings', fn: createRatings },
  { name: '006_create_news', fn: createNews },
  { name: '007_create_diario_analyses', fn: createDiario },
  { name: '008_add_cover_url_to_news', fn: addCoverUrl },
];

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');
    const qi = sequelize.getQueryInterface();
    for (const migration of migrations) {
      try {
        console.log(`Executando migration: ${migration.name}...`);
        await migration.fn(qi);
        console.log(`Migration ${migration.name} concluída.`);
      } catch (err: any) {
        if (err.original?.code === 'ER_TABLE_EXISTS_ERROR' || err.original?.code === 'ER_DUP_FIELDNAME' || err.original?.code === 'ER_DUP_KEYNAME') {
          console.log(`Já existe, pulando: ${migration.name}`);
        } else {
          throw err;
        }
      }
    }
    console.log('Todas as migrations foram executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();
