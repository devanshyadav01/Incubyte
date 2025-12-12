import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Sweet } from '../models/Sweet';

const sampleSweets = [
    { name: 'Milk Chocolate Bar', category: 'Chocolate', price: 2.99, quantity: 100 },
    { name: 'Dark Chocolate Truffles', category: 'Chocolate', price: 5.99, quantity: 50 },
    { name: 'Gummy Bears', category: 'Gummy', price: 1.99, quantity: 150 },
    { name: 'Sour Gummy Worms', category: 'Gummy', price: 2.49, quantity: 80 },
    { name: 'Rainbow Lollipops', category: 'Lollipop', price: 0.99, quantity: 200 },
    { name: 'Cherry Lollipop', category: 'Lollipop', price: 1.49, quantity: 120 },
    { name: 'Peppermint Candies', category: 'Hard Candy', price: 1.29, quantity: 90 },
    { name: 'Butterscotch Discs', category: 'Hard Candy', price: 1.79, quantity: 75 },
    { name: 'English Toffee', category: 'Toffee', price: 4.99, quantity: 40 },
    { name: 'Caramel Chews', category: 'Caramel', price: 3.49, quantity: 60 },
    { name: 'Marshmallow Treats', category: 'Other', price: 2.99, quantity: 85 },
    { name: 'White Chocolate Bark', category: 'Chocolate', price: 6.99, quantity: 30 },
    { name: 'Fruit Gummies', category: 'Gummy', price: 2.29, quantity: 110 },
    {
        name: 'Cola Gummies'
        , category: 'Gummy', price: 2.49, quantity: 0
    },  // Out of stock
    { name: 'Jawbreaker', category: 'Hard Candy', price: 0.79, quantity: 250 },
];

export const seedDatabase = async () => {
    try {
        // Check if data already exists
        const sweetCount = await Sweet.count();
        if (sweetCount > 0) {
            console.log('✅ Database already contains sweets');
            return;
        }

        console.log('🌱 Seeding database with sample sweets...');

        // Create sample sweets
        await Sweet.bulkCreate(sampleSweets);

        console.log('✅ Successfully seeded database with', sampleSweets.length, 'sweets');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};
