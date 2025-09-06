import app from './app'
import { connectDB } from './config/db'
import { env } from './config/env'

async function startServer() {
  await connectDB() // connect db

  app.listen(env.PORT, () => {
    console.log(`Server is running on port http://localhost:${env.PORT}`)
  })
}feat(server): add express, cors, and helmet middleware; configure database connection


startServer()
