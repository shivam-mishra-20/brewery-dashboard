import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI as string

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable')
}

// Maximum retries for DB operations
const MAX_RETRIES = 5
// Base delay between retries in ms
const BASE_RETRY_DELAY = 1000
// Maximum delay between retries
const MAX_RETRY_DELAY = 10000

/**
 * Check if an error is related to MongoDB connection issues
 * This includes network errors, DNS resolution errors, and connection errors
 */
function isRetriableError(error: unknown): boolean {
  if (!error) return false

  // Type guard to check if error is an object with properties
  if (typeof error !== 'object' || error === null) return false

  // Cast error to a record with string keys
  const err = error as Record<string, unknown>

  // Known MongoDB connection error names
  if (
    err.name === 'MongoNotConnectedError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoServerSelectionError'
  ) {
    return true
  }

  // DNS resolution errors and other network issues
  if (
    err.code === 'ESERVFAIL' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ECONNRESET' ||
    err.syscall === 'queryTxt' ||
    err.syscall === 'getaddrinfo'
  ) {
    return true
  }

  // Check error messages for connection-related issues
  if (err.message && typeof err.message === 'string') {
    const message = err.message.toLowerCase()
    return (
      message.includes('not connected') ||
      message.includes('disconnected') ||
      message.includes('timed out') ||
      message.includes('network') ||
      message.includes('topology') ||
      message.includes('dns') ||
      message.includes('server selection')
    )
  }

  return false
}

/**
 * Retry a database operation with exponential backoff
 */
export async function withDBRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  try {
    // Always ensure we're connected before any operation
    await connectDB()
    return await operation()
  } catch (error: unknown) {
    // If we have retries left and it's a retriable error, try again
    if (retries > 0 && isRetriableError(error)) {
      const attempt = MAX_RETRIES - retries + 1
      const errorObj = error as Record<string, unknown>

      // Log detailed information about the error for debugging
      const errorDetails = {
        name: (errorObj.name as string) || 'UnknownError',
        code: (errorObj.code as string) || 'UNKNOWN',
        message: (errorObj.message as string) || 'No message',
        syscall: (errorObj.syscall as string) || 'none',
        hostname: (errorObj.hostname as string) || 'unknown',
      }

      console.warn(
        `MongoDB operation failed: ${JSON.stringify(errorDetails)}, retrying... (${attempt}/${MAX_RETRIES})`,
      )

      // For DNS resolution errors, add more helpful logging
      if (
        errorDetails.code === 'ESERVFAIL' ||
        errorDetails.syscall === 'queryTxt'
      ) {
        console.warn(`
          DNS resolution error detected. This could be due to:
          1. Temporary DNS server issues
          2. Network configuration problems
          3. ISP DNS resolution issues
          See docs/mongodb-connection-guide.md for troubleshooting tips
        `)
      }

      // Wait before retrying with exponential backoff
      const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, attempt - 1),
        MAX_RETRY_DELAY,
      )
      console.log(`Waiting ${delay}ms before retry ${attempt}...`)
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Force a fresh connection
      cached.conn = null

      // Retry the operation
      return withDBRetry(operation, retries - 1)
    }

    // If we're out of retries or it's not a retriable error, rethrow
    throw error
  }
}

// Define a type for our cached MongoDB connection
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use the global namespace for caching the MongoDB connection
declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
}
if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB() {
  try {
    // If we already have a connection, reuse it
    if (cached.conn) {
      // Verify that the connection is still active
      if (mongoose.connection.readyState === 1) {
        return cached.conn
      }
      // If connection is broken, reset it so we create a new one
      cached.conn = null
      cached.promise = null
    }

    // If we're in the process of connecting, wait for it
    if (cached.promise) {
      try {
        cached.conn = await cached.promise
        return cached.conn
      } catch {
        // If the existing promise failed, reset it
        cached.promise = null
      }
    }

    // Create a new connection promise with better error handling
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // Faster timeout for initial connection
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully')
        return mongooseInstance
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err)
        cached.promise = null
        throw err
      })

    cached.conn = await cached.promise
    return cached.conn
  } catch (err) {
    console.error('Failed to establish MongoDB connection:', err)
    throw err
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
