import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to array buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique file name
    const fileExtension = file.name.split('.').pop()
    const fileName = `${type}-${Date.now()}.${fileExtension}`
    const folderPath = type === 'video' ? 'videos' : 'thumbnails'

    // Create a reference to the storage location
    const storageRef = ref(storage, `${folderPath}/${fileName}`)

    // Upload the file
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    })

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)

    return NextResponse.json({
      success: true,
      url: downloadURL,
      fileName,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    )
  }
}
