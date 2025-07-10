# MongoDB Connection Best Practices

## Issue Background

We've been experiencing connection errors in our API routes:

1. `MongoNotConnectedError: Client must be connected before running operations` - Occurs when MongoDB connection hasn't been established before trying to perform database operations
2. `ESERVFAIL: queryTxt cluster0.qgah0bj.mongodb.net` - DNS resolution error when trying to connect to MongoDB Atlas
3. Other connection and network errors when the MongoDB server is temporarily unavailable or network issues arise

## Solution: The `withDBRetry` Utility

We've implemented a robust solution using a utility function called `withDBRetry` in `src/lib/mongodb.ts`. This utility:

1. Ensures MongoDB connection is established before executing any database operation
2. Automatically retries operations if they fail due to connection issues (including DNS resolution failures)
3. Uses exponential backoff to avoid overwhelming the database with reconnection attempts
4. Provides global connection caching for efficiency

## DNS Resolution Issues

If you're seeing `ESERVFAIL` or `queryTxt` errors, these typically indicate DNS resolution problems. Common causes:

1. **Temporary DNS Server Issues**: Sometimes your local DNS server may fail to resolve MongoDB Atlas hostnames
2. **Network Configuration**: Corporate networks, VPNs, or certain network configurations may block or fail to resolve MongoDB Atlas domains
3. **ISP Problems**: Your Internet Service Provider might have temporary DNS resolution issues

### Resolving DNS Issues:

- **Try alternative DNS servers**: Configure your system or network to use alternative DNS servers (e.g., Google's `8.8.8.8` and `8.8.4.4`)
- **Check VPN settings**: If you're using a VPN, it might be blocking the necessary connections
- **Use IP-based connection strings**: In some cases, you might need to use IP-based connection strings instead of domain names (contact MongoDB Atlas support for assistance)
- **Verify MongoDB Atlas status**: Check if there's a service issue with MongoDB Atlas at https://status.mongodb.com/

## How to Use `withDBRetry`

When working with MongoDB in any API route, always use the `withDBRetry` pattern:

```typescript
import { withDBRetry } from '@/lib/mongodb'

// In your API route handler:
const data = await withDBRetry(async () => {
  // Your MongoDB operation here
  return await YourModel.find({...})
})
```

### Benefits:

1. **No explicit connect/disconnect needed:** The utility handles this automatically
2. **Auto-retry on connection errors:** If the database connection is lost, it will retry automatically
3. **Cleaner code:** No need for try/catch blocks around every database operation

## Example Implementation

```typescript
// Before
export async function GET(request) {
  try {
    await connectDB()
    const data = await YourModel.find({})
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  } finally {
    await disconnectDB()
  }
}

// After
export async function GET(request) {
  try {
    const data = await withDBRetry(async () => {
      return await YourModel.find({})
    })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
```

## Reliability Enhancements

Our implementation includes:

- **Global connection caching:** Reuses connections efficiently across requests
- **Configurable retry attempts:** Default is 5 retries with exponential backoff
- **Comprehensive error detection:** Handles connection errors, DNS failures, timeouts, and network issues
- **Clean connection management:** No manual connect/disconnect needed
- **Intelligent backoff:** Starts with shorter delays and increases them to avoid overwhelming the database

By following these patterns, our API routes will be more resilient against temporary database connection issues or concurrent request handling.

## Diagnostic & Migration Tools

### Connection Diagnostics

We've provided a diagnostic script to help you troubleshoot MongoDB connection issues:

```bash
# From the project root directory
node scripts/test-mongodb-connection.mjs
```

This script will:

1. Test DNS resolution for your MongoDB Atlas hostname
2. Check SRV records (if using mongodb+srv:// protocol)
3. Test actual connection to MongoDB
4. Provide detailed error information and troubleshooting tips if any step fails

This is particularly helpful for diagnosing intermittent network issues or DNS resolution problems.

### Migration Assistant

To help migrate all API routes to use the `withDBRetry` pattern consistently, we've provided a migration assistant:

```bash
# From the project root directory
node scripts/migrate-routes-to-withDBRetry.mjs
```

This script will:

1. Scan all API routes in your project
2. Identify routes that still use the old connection pattern
3. Show detailed information about each file that needs to be updated
4. Provide guidance on how to update each file

The script doesn't make changes automatically but helps you identify which files need updating and what changes to make.
