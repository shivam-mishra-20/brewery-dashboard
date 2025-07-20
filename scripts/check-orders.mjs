/**
 * Check Orders in MongoDB Script
 *
 * This script connects directly to MongoDB and checks if there are orders in the database.
 * Run with: node scripts/check-orders.mjs
 */

// Load environment variables from .env file
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
  `${colors.blue}${colors.bright}MongoDB Orders Check${colors.reset}\n`,
)

async function checkOrders() {
  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`)
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
    })
    console.log(`${colors.green}Connected successfully!${colors.reset}\n`)

    // Create a simple schema for orders (it doesn't need to be exactly the same as your actual schema)
    const OrderSchema = new mongoose.Schema({}, { strict: false })
    const OrderModel =
      mongoose.models.Order || mongoose.model('Order', OrderSchema)

    // Query for orders
    console.log(`${colors.yellow}Querying for orders...${colors.reset}`)
    const totalOrders = await OrderModel.countDocuments({})
    console.log(
      `${colors.green}Found ${totalOrders} total orders in the database${colors.reset}\n`,
    )

    // Get the 5 most recent orders
    if (totalOrders > 0) {
      const recentOrders = await OrderModel.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      console.log(
        `${colors.blue}${colors.bright}5 Most Recent Orders:${colors.reset}`,
      )
      recentOrders.forEach((order, index) => {
        console.log(`\n${colors.yellow}Order #${index + 1}:${colors.reset}`)
        console.log(`ID: ${order._id}`)
        console.log(`Customer: ${order.customerName}`)
        console.log(`Table: ${order.tableNumber || 'N/A'}`)
        console.log(`Status: ${order.status}`)
        console.log(`Payment: ${order.paymentStatus}`)
        console.log(`Total Items: ${order.items?.length || 0}`)
        console.log(`Created: ${order.createdAt}`)
      })

      // Also test the query that would be used in the API route
      console.log(
        `\n${colors.blue}${colors.bright}Testing API route query:${colors.reset}`,
      )

      // Test with no filters (should match all orders)
      const noFilterResult = await OrderModel.find({}).countDocuments()
      console.log(`Query with no filters: ${noFilterResult} results`)

      // Test with table filter if provided
      const testTableNumber = recentOrders[0]?.tableNumber
      if (testTableNumber) {
        const tableFilterResult = await OrderModel.find({
          tableNumber: testTableNumber,
        }).countDocuments()
        console.log(
          `Query with tableNumber=${testTableNumber}: ${tableFilterResult} results`,
        )
      }
    }

    console.log(
      `\n${colors.green}${colors.bright}✓ Check complete${colors.reset}`,
    )
  } catch (error) {
    console.error(
      `\n${colors.red}${colors.bright}Error:${colors.reset} ${error.message}`,
    )
    console.error(error)
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close()
    console.log(`\n${colors.blue}MongoDB connection closed${colors.reset}`)
  }
}

// Run the check
checkOrders()
