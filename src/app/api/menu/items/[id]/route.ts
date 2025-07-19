import { NextRequest, NextResponse } from 'next/server'

// This is a fallback implementation that doesn't rely on direct model imports
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    // Use your existing API to get all items, then filter by ID
    // This is less efficient but will work as a fallback
    const allItemsResponse = await fetch(`/api/menu/get-items`, {
      cache: 'no-store',
    })

    if (!allItemsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: allItemsResponse.status },
      )
    }

    const allItems = await allItemsResponse.json()
    const menuItem = allItems.menuItems?.find(
      (item: any) => item.id === id || item._id === id,
    )

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 },
    )
  }
}
