import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Sweet } from '../src/models/Sweet';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let userToken: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create admin user
    const adminResponse = await request(app)
        .post('/api/auth/register')
        .send({
            email: 'admin@example.com',
            password: 'admin123'
        });
    adminToken = adminResponse.body.token;

    // Create regular user
    const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
            email: 'user@example.com',
            password: 'user123'
        });
    userToken = userResponse.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Sweet.deleteMany({});
});

describe('Sweets Routes', () => {
    describe('POST /api/sweets', () => {
        it('should allow admin to add a sweet', async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 100
                });

            expect(response.status).toBe(201);
            expect(response.body.sweet.name).toBe('Chocolate Bar');
            expect(response.body.sweet.category).toBe('Chocolate');
        });

        it('should not allow non-admin to add a sweet', async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Gummy Bears',
                    category: 'Gummy',
                    price: 1.99,
                    quantity: 50
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/sweets')
                .send({
                    name: 'Lollipop',
                    category: 'Lollipop',
                    price: 0.99,
                    quantity: 200
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid category', async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Invalid Sweet',
                    category: 'InvalidCategory',
                    price: 1.99,
                    quantity: 50
                });

            expect(response.status).toBe(400);
        });

        it('should fail with negative price', async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Free Sweet',
                    category: 'Candy',
                    price: -1,
                    quantity: 50
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/sweets', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 100
                });

            await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Gummy Bears',
                    category: 'Gummy',
                    price: 1.99,
                    quantity: 50
                });
        });

        it('should return all sweets for authenticated user', async () => {
            const response = await request(app)
                .get('/api/sweets')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.sweets).toHaveLength(2);
        });

        it('should fail without authentication', async () => {
            const response = await request(app).get('/api/sweets');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/sweets/search', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 100
                });

            await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Milk Chocolate',
                    category: 'Chocolate',
                    price: 3.49,
                    quantity: 80
                });

            await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Gummy Bears',
                    category: 'Gummy',
                    price: 1.99,
                    quantity: 50
                });
        });

        it('should search by name', async () => {
            const response = await request(app)
                .get('/api/sweets/search?name=Chocolate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.sweets).toHaveLength(2);
        });

        it('should search by category', async () => {
            const response = await request(app)
                .get('/api/sweets/search?category=Gummy')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.sweets).toHaveLength(1);
            expect(response.body.sweets[0].name).toBe('Gummy Bears');
        });

        it('should search by price range', async () => {
            const response = await request(app)
                .get('/api/sweets/search?minPrice=2&maxPrice=3')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.sweets).toHaveLength(1);
            expect(response.body.sweets[0].name).toBe('Chocolate Bar');
        });
    });

    describe('PUT /api/sweets/:id', () => {
        let sweetId: string;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 100
                });
            sweetId = response.body.sweet._id;
        });

        it('should allow admin to update a sweet', async () => {
            const response = await request(app)
                .put(`/api/sweets/${sweetId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 3.49,
                    quantity: 150
                });

            expect(response.status).toBe(200);
            expect(response.body.sweet.price).toBe(3.49);
            expect(response.body.sweet.quantity).toBe(150);
        });

        it('should not allow non-admin to update a sweet', async () => {
            const response = await request(app)
                .put(`/api/sweets/${sweetId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    price: 3.49
                });

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent sweet', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/api/sweets/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 3.49
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/sweets/:id', () => {
        let sweetId: string;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 100
                });
            sweetId = response.body.sweet._id;
        });

        it('should allow admin to delete a sweet', async () => {
            const response = await request(app)
                .delete(`/api/sweets/${sweetId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Sweet deleted successfully');
        });

        it('should not allow non-admin to delete a sweet', async () => {
            const response = await request(app)
                .delete(`/api/sweets/${sweetId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent sweet', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/sweets/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });
});
