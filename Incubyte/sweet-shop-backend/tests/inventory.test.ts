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

describe('Inventory Routes', () => {
    describe('POST /api/sweets/:id/purchase', () => {
        let sweetId: string;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 10
                });
            sweetId = response.body.sweet._id;
        });

        it('should allow user to purchase a sweet', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 1 });

            expect(response.status).toBe(200);
            expect(response.body.sweet.quantity).toBe(9);
            expect(response.body.purchased).toBe(1);
        });

        it('should purchase default quantity of 1 if not specified', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.sweet.quantity).toBe(9);
        });

        it('should allow purchasing multiple quantities', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(200);
            expect(response.body.sweet.quantity).toBe(5);
            expect(response.body.purchased).toBe(5);
        });

        it('should fail when quantity is insufficient', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 15 });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Insufficient quantity');
            expect(response.body.available).toBe(10);
            expect(response.body.requested).toBe(15);
        });

        it('should fail when sweet is out of stock', async () => {
            // Purchase all available
            await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 10 });

            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 1 });

            expect(response.status).toBe(400);
            expect(response.body.available).toBe(0);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/purchase`)
                .send({ quantity: 1 });

            expect(response.status).toBe(401);
        });

        it('should fail for non-existent sweet', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/sweets/${fakeId}/purchase`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 1 });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/sweets/:id/restock', () => {
        let sweetId: string;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/sweets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Chocolate Bar',
                    category: 'Chocolate',
                    price: 2.99,
                    quantity: 10
                });
            sweetId = response.body.sweet._id;
        });

        it('should allow admin to restock a sweet', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/restock`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 50 });

            expect(response.status).toBe(200);
            expect(response.body.sweet.quantity).toBe(60);
            expect(response.body.restocked).toBe(50);
        });

        it('should not allow non-admin to restock', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/restock`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 50 });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/restock`)
                .send({ quantity: 50 });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid quantity', async () => {
            const response = await request(app)
                .post(`/api/sweets/${sweetId}/restock`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: -10 });

            expect(response.status).toBe(400);
        });

        it('should fail for non-existent sweet', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/sweets/${fakeId}/restock`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ quantity: 50 });

            expect(response.status).toBe(404);
        });
    });
});
