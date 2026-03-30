import { sequelize } from '../config/database';
import '../models/index';
import { seedPoliticians } from './politicians.seeder';
import { seedPromises } from './promises.seeder';
import { seedNews } from './news.seeder';

async function runSeeders() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.\n');

    console.log('=== Executando Seeds ===\n');
    await seedPoliticians();
    await seedPromises();
    await seedNews();

    console.log('\n=== Todos os seeds foram executados com sucesso! ===');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
  }
}

runSeeders();
