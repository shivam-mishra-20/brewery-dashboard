import CryptoJS from 'crypto-js'

// Secret key for encryption/decryption - should match the key used to generate QR codes
const SECRET_KEY =
  process.env.NEXT_PUBLIC_QR_SECRET || 'your-fallback-secret-key'

/**
 * Decrypt the table data from the QR code URL parameter
 * @param encryptedData - The encrypted string from the URL
 * @returns - The decrypted table data object or null if invalid
 */
export function decryptTableData(
  encryptedData: string,
): { tableId: string; tableName: string; tableNumber: string } | null {
  try {
    // First URL decode the data
    const decodedData = decodeURIComponent(encryptedData)

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(decodedData, SECRET_KEY).toString(
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

/**
 * Encrypt table data for generating QR codes
 * @param tableData - The table data object to encrypt
 * @returns - The encrypted string
 */
export function encryptTableData(tableData: {
  tableId: string
  tableName?: string
  tableNumber: string
}): string {
  try {
    // Convert the object to a JSON string
    const jsonString = JSON.stringify(tableData)

    // Encrypt the JSON string
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString()

    // URL encode the encrypted string
    return encodeURIComponent(encrypted)
  } catch (error) {
    console.error('Error encrypting table data:', error)
    throw error
  }
}
