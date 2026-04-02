import 'dotenv/config';
import request from 'supertest';
import app from '../src/app/app.js';

describe('App Core functionality', () => {

  it('GET /health should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('Protected routes should return 401 without auth header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('CORS is applied', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:5173');
    // Express cors middleware typically responds to preflight
    expect(res.statusCode).toEqual(204);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('Unknown routes should be handled by standard error or 404', async () => {
    const res = await request(app).get('/some-non-existent-route-for-testing');
    expect(res.statusCode).toEqual(404);
  });

});
