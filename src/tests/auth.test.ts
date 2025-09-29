import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../app'

describe('Auth API', () => {
  // check schema
  it('should throw invalid input error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'abc',
    })

    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('status')
    expect(res.body).toHaveProperty('message')
    expect(res.body.status).toBe('failed')
    expect(res.body.message).toBe(
      'Invalid input data. Please check and try again.'
    )
  })

  // check normal registration
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'test',
      email: 'test@test.com',
      password: 'test12345678',
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('status')
    expect(res.body.status).toBe(
      'Registration successful. Please verify your email to activate your account.'
    )
    expect(res.body).toHaveProperty('user')
  })

  // check duplicate email
  it('should not register with same email twice', async () => {
    // 1st registration
    await request(app).post('/api/auth/register').send({
      firstName: 'test',
      email: 'testsmthn@test.com',
      password: 'testsmthn1',
    })

    // 2nd registration with same email
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'test',
      email: 'testsmthn@test.com',
      password: 'testsmthn1',
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('status')
    expect(res.body).toHaveProperty('message')
    expect(res.body.status).toBe('failed')
    expect(res.body.message).toBe('User with this email already exists')
  })

  // check rate limit middleware
  it('should block requests after exceeding the limit', async () => {
    const user = {
      firstName: 'smthn',
      email: 'smthn@smthn.com',
      password: 'smthnsmthn12',
    }

    let lastResponse: any

    // send 10 reqs
    for (let i = 1; i <= 10; ++i) {
      lastResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...user,
          email: `smthn${i}@smthn.com`,
        })

      expect(lastResponse.status).not.toBe(429)
    }

    // one more req to exceed the limit
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...user,
        email: 'rate11@test.com',
      })

    expect(res.status).toBe(429)
    expect(res.text).toContain(
      'Too many registration attempts. Please wait a minute.'
    )
  })
})
