import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app: Express = express()

// middleware setup
app.use(cors())
app.use(helmet())
app.use(express.json())

// routes
// later

export default app
