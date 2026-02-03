// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * CORS middleware
 * Allows frontend on mogges-store.se to access API
 */
app.use(
	'/api/*',
	cors({
		origin: [
			'https://www.mogges-store.se',
			'https://mogges-store.se',
			'http://localhost:8080',
			'http://127.0.0.1:8080'
		],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true
	})
);

// API root
app.get('/api', (c) => {
	return c.text('Mogges Store API is running');
});

// Products
app.get('/api/products', async (c) => {
	const { results } = await c.env.DB
		.prepare(
			'SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products'
		)
		.all();

	return c.json(results);
});

export default app;
