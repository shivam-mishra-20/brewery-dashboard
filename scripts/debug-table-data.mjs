/**
 * Debug script for encrypted table data
 * This helps identify tables by looking at recent orders
 */

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

// The encrypted table value from the URL
// Update this with your actual encrypted value from the URL parameter
const ENCRYPTED_TABLE_VALUE =
  'U2FsdGVkX1/kl389jluuQNTRUBsAIwTcwQfaSie8HzRWizS1T5VvEZKpPIFesJ+NmwvJo1V+CPBK9Dggw1d1jTpP8/0GYy7Q/wdvVcvpJGI82Vq8pkVbDaTvvOMOBEEKDHpgGeJgmM3vbeY6MvRW+t/C5gX5LLmQvtBVpD2GiD4='

async function debugTableData() {
  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`)
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
    })
    console.log(`${colors.green}Connected successfully!${colors.reset}\n`)

    // Create a simple schema for orders and tables
    const OrderSchema = new mongoose.Schema({}, { strict: false })
    const TableSchema = new mongoose.Schema({}, { strict: false })

    const OrderModel =
      mongoose.models.Order || mongoose.model('Order', OrderSchema)
    const TableModel =
      mongoose.models.Table || mongoose.model('Table', TableSchema)

    // First, let's list all tables in the system
    console.log(
      `${colors.blue}${colors.bright}Available Tables:${colors.reset}`,
    )
    const allTables = await TableModel.find({}).lean()
    allTables.forEach((table, index) => {
      console.log(
        `${colors.green}#${index + 1}${colors.reset} - ID: ${table._id}, Number: ${table.number}, Name: ${table.name || 'N/A'}`,
      )
    })

    console.log(
      `\n${colors.blue}${colors.bright}Encrypted Table Value:${colors.reset}`,
    )
    console.log(ENCRYPTED_TABLE_VALUE)

    console.log(
      `\n${colors.yellow}Looking for orders with this encrypted table value...${colors.reset}`,
    )

    // Create a regex to find any orders with the encrypted value in any field
    const recentOrders = await OrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    console.log(
      `\n${colors.blue}${colors.bright}Recent Orders Table Numbers:${colors.reset}`,
    )
    const tableNumbers = [
      ...new Set(recentOrders.map((order) => order.tableNumber)),
    ].filter(Boolean)
    console.log(tableNumbers)

    // Table ID to table number mapping
    console.log(
      `\n${colors.blue}${colors.bright}Table ID to Number Mapping:${colors.reset}`,
    )
    const tableIdToNumber = {}
    for (const order of recentOrders) {
      if (order.tableId && order.tableNumber) {
        tableIdToNumber[order.tableId] = order.tableNumber
      }
    }

    Object.entries(tableIdToNumber).forEach(([id, number]) => {
      console.log(`Table ID: ${id} → Table Number: ${number}`)
    })

    console.log(
      `\n${colors.green}${colors.bright}✓ Debug complete${colors.reset}`,
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

// Run the debug function
debugTableData()
