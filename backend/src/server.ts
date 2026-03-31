import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { sequelize } from './config/database';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { startScoreJob } from './jobs/score.job';
import { startDiarioJob } from './jobs/diario.job';
import { startPromisesJob } from './jobs/promises.job';
import './models';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', routes);
app.use(errorHandler);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('Banco de dados conectado.');

    startScoreJob();
    startDiarioJob();
    startPromisesJob();

    app.listen(env.PORT, () => {
      console.log(`Servidor rodando na porta ${env.PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

bootstrap();
