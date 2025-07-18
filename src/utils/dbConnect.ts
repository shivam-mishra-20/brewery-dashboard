import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI!

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

// Add a type declaration for global.mongoose
declare global {
  // eslint-disable-next-line no-var
  var mongoose:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined
}

let cached = global.mongoose as
  | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
  | undefined

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect(): Promise<typeof mongoose> {
  if (!cached) {
    throw new Error('Database connection cache is not initialized')
  }
  if (cached.conn) {
    return cached.conn as typeof mongoose
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Changed to true to allow buffering commands before connection
    }

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully')
        cached.conn = mongooseInstance
        return mongooseInstance
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err)
        cached.promise = null
        throw err
      })
  }
  await cached.promise
  if (!cached.conn) {
    throw new Error('Failed to establish a mongoose connection')
  }
  return cached.conn
}

export default dbConnect
