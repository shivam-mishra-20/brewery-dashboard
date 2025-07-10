/**
 * DNS Diagnostics and Environment Configuration Script
 *
 * This script helps diagnose DNS-related issues that can affect MongoDB Atlas connections
 * and provides guidance on fixing them.
 */

import { exec } from 'child_process'
import dns from 'dns'
import { promises as fs } from 'fs'
import os from 'os'
import util from 'util'

// Promisify exec
const execPromise = util.promisify(exec)

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

// Load environment variables from .env file (if available)
try {
  const envData = await fs.readFile('.env', 'utf8')
  const envVars = envData
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [key, ...valueParts] = line.split('=')
      return [key.trim(), valueParts.join('=').trim()]
    })
    .filter(([key]) => key)

  for (const [key, value] of envVars) {
    if (key === 'MONGO_URI' && !process.env.MONGO_URI) {
      process.env.MONGO_URI = value
    }
  }
} catch {
  // .env file might not exist - that's okay
}

// MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI

// Test domains
const testDomains = [
  'mongodb.com',
  'mongodb.net',
  'google.com',
  'github.com',
  'npmjs.com',
]

// DNS Servers to test
const dnsServers = [
  { name: 'Current System DNS', servers: null },
  { name: 'Google DNS', servers: ['8.8.8.8', '8.8.4.4'] },
  { name: 'Cloudflare DNS', servers: ['1.1.1.1', '1.0.0.1'] },
  { name: 'Quad9', servers: ['9.9.9.9', '149.112.112.112'] },
]

// Get MongoDB hostname from URI
let mongoHostname = null
if (MONGO_URI) {
  const match = MONGO_URI.match(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^\/\?]+)/)
  if (match && match[1]) {
    mongoHostname = match[1]
    testDomains.unshift(mongoHostname)
  }
}

/**
 * Test DNS resolution
 */
async function testDnsResolution(hostname, servers = null) {
  const resolver = new dns.promises.Resolver()
  if (servers) {
    resolver.setServers(servers)
  }

  try {
    const startTime = Date.now()
    const addresses = await resolver.resolve4(hostname)
    const duration = Date.now() - startTime
    return {
      success: true,
      addresses,
      duration,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      addresses: [],
      duration: 0,
      error,
    }
  }
}

/**
 * Get current system DNS servers
 */
async function getCurrentDnsServers() {
  try {
    let servers = []

    switch (os.platform()) {
      case 'win32':
        // Windows
        const { stdout: winStdout } = await execPromise('ipconfig /all')
        const dnsRegex = /DNS Servers[^\n]+:\s*([^\s]+)/g
        let match
        while ((match = dnsRegex.exec(winStdout)) !== null) {
          servers.push(match[1])
        }
        break

      case 'darwin':
        // macOS
        const { stdout: macStdout } = await execPromise(
          'scutil --dns | grep "nameserver\\[[0-9]*\\]"',
        )
        const macLines = macStdout.split('\n')
        for (const line of macLines) {
          const match = line.match(/nameserver\[[0-9]+\] : ([0-9.]+)/)
          if (match) {
            servers.push(match[1])
          }
        }
        break

      default:
        // Linux and others - check /etc/resolv.conf
        try {
          const resolvConf = await fs.readFile('/etc/resolv.conf', 'utf8')
          const lines = resolvConf.split('\n')
          for (const line of lines) {
            if (line.trim().startsWith('nameserver')) {
              const parts = line.trim().split(/\s+/)
              if (parts.length >= 2) {
                servers.push(parts[1])
              }
            }
          }
        } catch (err) {
          console.log(
            `${colors.yellow}Could not read /etc/resolv.conf: ${err.message}${colors.reset}`,
          )
        }
    }

    // Remove duplicates
    servers = [...new Set(servers)]
    return servers
  } catch (err) {
    console.log(
      `${colors.yellow}Could not determine current DNS servers: ${err.message}${colors.reset}`,
    )
    return ['Unknown']
  }
}

/**
 * Print DNS configuration help
 */
function printDnsConfigHelp() {
  const platform = os.platform()

  console.log(
    `\n${colors.magenta}${colors.bright}How to Change DNS Servers:${colors.reset}`,
  )

  switch (platform) {
    case 'win32':
      // Windows
      console.log(`
${colors.cyan}Windows:${colors.reset}
1. Right-click on the Start menu and select "Network Connections"
2. Click on your active network connection
3. Click "Properties"
4. Select "Internet Protocol Version 4 (TCP/IPv4)" and click "Properties"
5. Select "Use the following DNS server addresses"
6. Enter the primary and secondary DNS server addresses
7. Click "OK" to save changes`)
      break

    case 'darwin':
      // macOS
      console.log(`
${colors.cyan}macOS:${colors.reset}
1. Click the Apple menu and select "System Preferences"
2. Click "Network"
3. Select your active network connection
4. Click "Advanced"
5. Click the "DNS" tab
6. Click the "+" button to add DNS servers
7. Enter the DNS server addresses
8. Click "OK" and then "Apply"`)
      break

    default:
      // Linux
      console.log(`
${colors.cyan}Linux:${colors.reset}
1. Edit the file /etc/resolv.conf as root:
   sudo nano /etc/resolv.conf

2. Add or modify the nameserver lines:
   nameserver 8.8.8.8
   nameserver 8.8.4.4

3. Save the file (Ctrl+O, then Enter) and exit (Ctrl+X)

Note: On some Linux distributions, these changes may be overwritten. You may need to 
configure your DNS through your network manager or system settings.`)
  }

  console.log(`
${colors.cyan}Recommended DNS Servers:${colors.reset}
• Google DNS: 8.8.8.8 and 8.8.4.4
• Cloudflare: 1.1.1.1 and 1.0.0.1
• Quad9: 9.9.9.9 and 149.112.112.112`)
}

/**
 * Main function
 */
async function main() {
  console.log(
    `${colors.blue}${colors.bright}DNS Resolution Diagnostics${colors.reset}\n`,
  )

  // Print system info
  console.log(`${colors.cyan}System Information:${colors.reset}`)
  console.log(`• Operating System: ${os.type()} ${os.release()}`)
  console.log(`• Platform: ${os.platform()}`)
  console.log(`• Hostname: ${os.hostname()}`)

  // Get current DNS servers
  const currentDnsServers = await getCurrentDnsServers()
  console.log(`• Current DNS Servers: ${currentDnsServers.join(', ')}\n`)

  if (mongoHostname) {
    console.log(
      `${colors.cyan}MongoDB Atlas Hostname:${colors.reset} ${mongoHostname}\n`,
    )
  } else {
    console.log(
      `${colors.yellow}No MongoDB URI found in environment variables${colors.reset}\n`,
    )
  }

  // Test DNS resolution with different DNS servers
  console.log(
    `${colors.magenta}${colors.bright}Testing DNS Resolution...${colors.reset}\n`,
  )

  const results = {}

  for (const dnsServer of dnsServers) {
    console.log(`${colors.cyan}Using ${dnsServer.name}:${colors.reset}`)

    if (dnsServer.servers) {
      console.log(`(${dnsServer.servers.join(', ')})`)
    }

    let totalSuccesses = 0
    let totalFailures = 0

    for (const domain of testDomains) {
      const result = await testDnsResolution(domain, dnsServer.servers)

      if (result.success) {
        totalSuccesses++
        console.log(
          `• ${domain}: ${colors.green}Success${colors.reset} (${result.duration}ms) - ${result.addresses.join(', ')}`,
        )
      } else {
        totalFailures++
        console.log(
          `• ${domain}: ${colors.red}Failed${colors.reset} - ${result.error.code}`,
        )
      }
    }

    const successRate = Math.round((totalSuccesses / testDomains.length) * 100)
    console.log(
      `\n${colors.cyan}Summary:${colors.reset} ${successRate}% success rate (${totalSuccesses} succeeded, ${totalFailures} failed)\n`,
    )

    results[dnsServer.name] = { successRate, totalSuccesses, totalFailures }
  }

  // Find the best DNS server
  let bestDnsServer = dnsServers[0].name
  let bestSuccessRate = results[dnsServers[0].name].successRate

  for (let i = 1; i < dnsServers.length; i++) {
    const serverName = dnsServers[i].name
    const successRate = results[serverName].successRate

    if (successRate > bestSuccessRate) {
      bestDnsServer = serverName
      bestSuccessRate = successRate
    }
  }

  // Print recommendations
  console.log(
    `${colors.magenta}${colors.bright}Recommendations:${colors.reset}`,
  )

  if (results['Current System DNS'].successRate < 100) {
    console.log(
      `${colors.yellow}Your current DNS configuration is having issues resolving some domains.${colors.reset}`,
    )

    if (bestSuccessRate > results['Current System DNS'].successRate) {
      console.log(
        `${colors.green}Based on testing, ${bestDnsServer} performed better.${colors.reset}`,
      )

      const bestDnsServerConfig = dnsServers.find(
        (ds) => ds.name === bestDnsServer,
      )
      if (bestDnsServerConfig && bestDnsServerConfig.servers) {
        console.log(
          `Consider changing your DNS servers to: ${bestDnsServerConfig.servers.join(', ')}`,
        )
      }

      printDnsConfigHelp()
    }
  } else {
    console.log(
      `${colors.green}Your current DNS configuration is working well.${colors.reset}`,
    )
  }

  console.log(
    `\n${colors.blue}${colors.bright}DNS Diagnostics Complete${colors.reset}`,
  )
}

main().catch((err) => {
  console.error(`${colors.red}Error running diagnostics:${colors.reset}`, err)
  process.exit(1)
})
