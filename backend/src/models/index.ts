import User from './User';
import Politician from './Politician';
import PromiseModel from './Promise';
import Vote from './Vote';
import Rating from './Rating';
import News from './News';
import DiarioAnalysis from './DiarioAnalysis';

// Associations
Politician.hasMany(PromiseModel, { foreignKey: 'politician_id', as: 'promises' });
PromiseModel.belongsTo(Politician, { foreignKey: 'politician_id', as: 'politician' });

User.hasMany(Vote, { foreignKey: 'user_id', as: 'votes' });
Vote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Politician.hasMany(Vote, { foreignKey: 'politician_id', as: 'votes' });
Vote.belongsTo(Politician, { foreignKey: 'politician_id', as: 'politician' });

User.hasMany(Rating, { foreignKey: 'user_id', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Politician.hasMany(Rating, { foreignKey: 'politician_id', as: 'ratings' });
Rating.belongsTo(Politician, { foreignKey: 'politician_id', as: 'politician' });

User.hasMany(News, { foreignKey: 'author_id', as: 'news' });
News.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

export { User, Politician, PromiseModel, Vote, Rating, News, DiarioAnalysis };
