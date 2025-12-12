import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_PATH = process.env.DATABASE_PATH || './database.sqlite';

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DATABASE_PATH,
    logging: false
});

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('✅ SQLite database connected successfully');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await sequelize.close();
        console.log('Database disconnected');
    } catch (error) {
        console.error('Error disconnecting from database:', error);
    }
};
