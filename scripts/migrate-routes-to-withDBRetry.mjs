/**
 * This script helps convert existing API routes to use the withDBRetry pattern
 * It searches for files that might need updating and guides you through the process
 */

import { promises as fs } from 'fs'
import path from 'path'
import readline from 'readline'

const API_ROUTES_DIR = path.resolve('./src/app/api')

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

/**
 * Promisify readline question
 */
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer)
    })
  })
}

/**
 * Find all route.ts files in the API directory
 */
async function findApiRoutes(dir, fileList = []) {
  const files = await fs.readdir(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)

    if (stat.isDirectory()) {
      fileList = await findApiRoutes(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }

  return fileList
}

/**
 * Check if a file needs to be updated
 */
async function fileNeedsUpdate(filePath) {
  const content = await fs.readFile(filePath, 'utf8')

  // If already uses withDBRetry, it doesn't need updating
  if (content.includes('withDBRetry')) {
    return false
  }

  // If it connects to MongoDB but doesn't use withDBRetry, it needs updating
  if (
    content.includes('connectDB') ||
    content.includes('mongoose') ||
    content.includes('Model.find') ||
    content.includes('findById') ||
    content.includes('.create(') ||
    content.includes('.findOne')
  ) {
    return true
  }

  return false
}

/**
 * Print a summary of the file
 */
async function printFileSummary(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const lines = content.split('\n')

  // Determine if it's using mongoose models
  const modelImports = lines.filter(
    (line) =>
      line.includes('import') &&
      (line.includes('Model') || line.includes('models/')),
  )

  // Look for database operations
  const dbOperations = lines.filter(
    (line) =>
      line.includes('find(') ||
      line.includes('findById') ||
      line.includes('findOne') ||
      line.includes('.create(') ||
      line.includes('.update') ||
      line.includes('.delete') ||
      line.includes('.save('),
  )

  // Look for connection management
  const connectionManagement = lines.filter(
    (line) => line.includes('connectDB') || line.includes('disconnectDB'),
  )

  console.log(
    `\n${colors.blue}${colors.bright}File Summary:${colors.reset} ${path.relative('.', filePath)}`,
  )

  if (modelImports.length > 0) {
    console.log(`\n${colors.cyan}Model Imports:${colors.reset}`)
    modelImports.forEach((line) =>
      console.log(`  ${colors.dim}${line.trim()}${colors.reset}`),
    )
  }

  if (dbOperations.length > 0) {
    console.log(`\n${colors.cyan}Database Operations:${colors.reset}`)
    dbOperations.forEach((line) =>
      console.log(`  ${colors.yellow}${line.trim()}${colors.reset}`),
    )
  }

  if (connectionManagement.length > 0) {
    console.log(`\n${colors.cyan}Connection Management:${colors.reset}`)
    connectionManagement.forEach((line) =>
      console.log(`  ${colors.red}${line.trim()}${colors.reset}`),
    )
  }
}

/**
 * Main function
 */
async function main() {
  console.log(
    `${colors.blue}${colors.bright}MongoDB Route Migration Tool${colors.reset}`,
  )
  console.log(
    `This tool helps migrate API routes to use the withDBRetry pattern for robust MongoDB connections.\n`,
  )

  try {
    // Find all API routes
    console.log(
      `${colors.magenta}Scanning API routes directory...${colors.reset}`,
    )
    const apiRoutes = await findApiRoutes(API_ROUTES_DIR)
    console.log(`Found ${apiRoutes.length} route files.\n`)

    // Check which ones need updates
    console.log(
      `${colors.magenta}Analyzing files that need updates...${colors.reset}`,
    )
    const routesToUpdate = []

    for (const route of apiRoutes) {
      if (await fileNeedsUpdate(route)) {
        routesToUpdate.push(route)
      }
    }

    console.log(
      `Found ${routesToUpdate.length} route files that need updating.\n`,
    )

    if (routesToUpdate.length === 0) {
      console.log(
        `${colors.green}${colors.bright}All routes are already using the withDBRetry pattern!${colors.reset}`,
      )
      rl.close()
      return
    }

    // List the files that need updates
    console.log(
      `${colors.yellow}${colors.bright}Files needing migration to withDBRetry pattern:${colors.reset}`,
    )
    routesToUpdate.forEach((route, i) => {
      console.log(`${i + 1}. ${path.relative('.', route)}`)
    })

    console.log(
      `\n${colors.magenta}${colors.bright}Manual Migration Steps:${colors.reset}`,
    )
    console.log(
      `1. Replace 'connectDB, disconnectDB' import with 'withDBRetry'`,
    )
    console.log(`2. Remove explicit connectDB() calls`)
    console.log(
      `3. Wrap database operations in withDBRetry(async () => { ... })`,
    )
    console.log(`4. Remove disconnectDB() calls from finally blocks`)

    // Prompt the user to examine each file
    for (const filePath of routesToUpdate) {
      await printFileSummary(filePath)

      const answer = await question(
        `\n${colors.green}Examine next file? (y/n) ${colors.reset}`,
      )
      if (answer.toLowerCase() !== 'y') {
        break
      }
    }

    console.log(`\n${colors.magenta}${colors.bright}Next Steps:${colors.reset}`)
    console.log(
      `1. Refer to docs/mongodb-connection-guide.md for detailed migration instructions`,
    )
    console.log(
      `2. Use the example in /api/menu/get-items/route.ts as a reference implementation`,
    )
    console.log(
      `3. Test each API route after updating to ensure it works correctly\n`,
    )

    console.log(
      `${colors.green}${colors.bright}Migration tool complete!${colors.reset}`,
    )
  } catch (err) {
    console.error(`${colors.red}Error:${colors.reset}`, err)
  } finally {
    rl.close()
  }
}

main()
