/**
 * Test MongoDB Connection Script
 *
 * This script tests the connection to MongoDB and helps diagnose connection issues.
 * Run with: node scripts/test-mongodb-connection.mjs
 */

// Load environment variables from .env file
import dns from 'dns'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

// MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  console.error(
    `${colors.red}${colors.bright}Error:${colors.reset} MONGO_URI environment variable is not defined.`,
  )
  console.error('Please ensure you have a .env file with MONGO_URI defined.')
  process.exit(1)
}

console.log(
  `${colors.blue}${colors.bright}MongoDB Connection Diagnostics${colors.reset}\n`,
)
console.log(
  `${colors.yellow}Testing connection to:${colors.reset} ${MONGO_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`,
)

// Extract the hostname from the URI
const hostname = MONGO_URI.match(
  /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^\/\?]+)/,
)?.[1]

if (!hostname) {
  console.error(
    `${colors.red}${colors.bright}Error:${colors.reset} Could not parse hostname from MongoDB URI.`,
  )
  process.exit(1)
}

console.log(
  `\n${colors.magenta}Step 1:${colors.reset} Testing DNS resolution for ${hostname}`,
)

// Convert DNS functions to promise-based
const dnsResolve = (hostname) => {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, (err, addresses) => {
      if (err) reject(err)
      else resolve(addresses)
    })
  })
}

const dnsResolveSrv = (hostname) => {
  return new Promise((resolve, reject) => {
    dns.resolveSrv(hostname, (err, records) => {
      if (err) reject(err)
      else resolve(records)
    })
  })
}

// Test DNS resolution
async function runDiagnostics() {
  try {
    const addresses = await dnsResolve(hostname)
    console.log(
      `${colors.green}✓ DNS resolution successful:${colors.reset}`,
      addresses,
    )

    // If using MongoDB+SRV, also test SRV records
    if (MONGO_URI.includes('mongodb+srv')) {
      console.log(
        `\n${colors.magenta}Step 2:${colors.reset} Testing SRV records for ${hostname}`,
      )
      try {
        const records = await dnsResolveSrv(`_mongodb._tcp.${hostname}`)
        console.log(
          `${colors.green}✓ SRV records found:${colors.reset}`,
          records.length,
        )
      } catch (errSrv) {
        console.error(
          `${colors.red}✖ SRV record resolution failed:${colors.reset}`,
          errSrv.code,
          errSrv.message,
        )
      }
    }

    // Continue to MongoDB connection test
    await testMongoDBConnection()
  } catch (err) {
    console.error(
      `${colors.red}✖ DNS resolution failed:${colors.reset}`,
      err.code,
      err.message,
    )
    console.log(`\n${colors.yellow}Possible solutions:${colors.reset}`)
    console.log('1. Check your internet connection')
    console.log(
      '2. Try using alternative DNS servers (e.g., Google DNS: 8.8.8.8)',
    )
    console.log(
      '3. Check if your ISP or network is blocking MongoDB Atlas domains',
    )
    console.log('4. Verify the MongoDB Atlas hostname is correct')
    process.exit(1)
  }
}

// Test actual MongoDB connection
async function testMongoDBConnection() {
  console.log(
    `\n${colors.magenta}Step 3:${colors.reset} Testing MongoDB connection`,
  )

  const connectionOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  }

  const startTime = Date.now()

  try {
    await mongoose.connect(MONGO_URI, connectionOptions)
    const connectionTime = Date.now() - startTime

    console.log(
      `${colors.green}✓ Connected to MongoDB successfully${colors.reset} (${connectionTime}ms)`,
    )
    console.log(`${colors.green}✓ Connection string is valid${colors.reset}`)
    console.log(`${colors.green}✓ Authentication successful${colors.reset}`)

    // Show connection details
    const conn = mongoose.connection
    console.log(`\n${colors.blue}Connection Details:${colors.reset}`)
    console.log(`• Host: ${conn.host}`)
    console.log(`• Port: ${conn.port}`)
    console.log(`• Database: ${conn.db.databaseName}`)
    console.log(
      `• Connection State: ${['disconnected', 'connected', 'connecting', 'disconnecting'][conn.readyState]}`,
    )

    await mongoose.disconnect()
    console.log(
      `\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset} Your MongoDB connection is working correctly.`,
    )
    process.exit(0)
  } catch (err) {
    console.error(
      `${colors.red}✖ MongoDB connection failed:${colors.reset}`,
      err.message,
    )

    // Provide specific guidance based on the error
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`)

    if (err.name === 'MongoServerSelectionError') {
      console.log(
        '1. Check if the MongoDB Atlas cluster is running and accessible',
      )
      console.log('2. Verify your IP address is whitelisted in MongoDB Atlas')
      console.log(
        '3. Check for network restrictions that might block MongoDB connections',
      )
    } else if (err.name === 'MongoParseError') {
      console.log('1. Your connection string format is invalid')
      console.log('2. Check for typos in your MONGO_URI environment variable')
    } else if (err.message.includes('Authentication failed')) {
      console.log(
        '1. Your username or password in the connection string is incorrect',
      )
      console.log('2. Verify the user exists and has appropriate permissions')
    } else if (err.message.includes('ECONNREFUSED')) {
      console.log('1. Cannot establish a connection to the specified server')
      console.log('2. Check if the hostname and port are correct')
      console.log('3. Verify there are no firewalls blocking the connection')
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('1. The hostname could not be found')
      console.log('2. Check your DNS configuration')
      console.log('3. Verify the hostname in your connection string is correct')
    } else {
      console.log('1. Verify your MongoDB Atlas cluster is operational')
      console.log('2. Check your network connection')
      console.log('3. Verify your connection string is correct')
    }

    console.log(
      `\nFor more information, refer to the MongoDB documentation or check docs/mongodb-connection-guide.md`,
    )
    process.exit(1)
  }
}

// Run the diagnostics
runDiagnostics().catch((err) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, err)
  process.exit(1)
})
