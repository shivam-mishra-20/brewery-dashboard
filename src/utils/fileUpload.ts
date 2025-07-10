import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '@/lib/firebase'

/**
 * Helper function to upload a file to Firebase Storage
 *
 * @param file - The file to upload
 * @param directory - The directory in Firebase Storage (e.g., 'menu-items')
 * @returns The download URL of the uploaded file
 */
export async function uploadFileToStorage(
  file: File,
  directory: string,
): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('Invalid file')
  }

  try {
    // Generate a unique filename to prevent collisions
    const filename = `${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storageRef = ref(storage, `${directory}/${filename}`)

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer()

    // Upload to Firebase Storage
    await uploadBytes(storageRef, buffer)

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error(`Failed to upload file: ${(error as Error).message}`)
  }
}
