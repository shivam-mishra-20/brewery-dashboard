import CryptoJS from 'crypto-js'

// src/lib/table.ts

/**
 * Extracts the raw tabledata param from a URL.
 */
export function extractRawTableData(url: string): string | null {
  const parsed = new URL(
    url,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  )
  return parsed.searchParams.get('tabledata')
}

/**
 * Full pipeline: extract, decode, decrypt.
 */
export function getTableNumberFromUrl(url: string): string {
  const raw = extractRawTableData(url)
  if (!raw) return ''
  const decoded = decodeURIComponent(raw)
  const tableData = decryptTableData(decoded)
  return tableData?.tableNumber || ''
}

/**
 * Get full table data object from URL
 */
export function getTableDataFromUrl(
  url: string,
): { tableId: string; tableName: string; tableNumber: string } | null {
  const raw = extractRawTableData(url)
  if (!raw) return null
  const decoded = decodeURIComponent(raw)
  return decryptTableData(decoded)
}

// Secret key for encryption/decryption
const SECRET_KEY =
  process.env.NEXT_PUBLIC_QR_SECRET || 'your-fallback-secret-key'

function decryptTableData(
  encoded: string,
): { tableId: string; tableName: string; tableNumber: string } | null {
  try {
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encoded, SECRET_KEY).toString(
      CryptoJS.enc.Utf8,
    )

    // Parse the JSON string to an object
    const tableData = JSON.parse(decrypted)

    // Validate the object has required properties
    if (!tableData.tableId) {
      console.error('Decrypted table data is missing tableId')
      return null
    }

    return tableData
  } catch (error) {
    console.error('Error decrypting table data:', error)
    return null
  }
}
// (Don’t forget to import or define decryptTableData here)
