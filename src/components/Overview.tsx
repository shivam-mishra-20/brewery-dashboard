import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MenuItem } from '@/models/MenuItem'
import { getAllMenuItems } from '@/services/menuService'

export default function Overview() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('Cappuccino')
  const [categories, setCategories] = useState<string[]>([])
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')

  useEffect(() => {
    async function fetchMenu() {
      const items = await getAllMenuItems()
      setMenuItems(items)
      setCategories([...new Set(items.map((item) => item.category))])
      // Default to first category if exists
      if (items.length && !categories.includes(activeCategory)) {
        setActiveCategory(items[0].category)
      }
    }
    fetchMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allCategories = ['All', ...categories]
  const itemsToShow =
    activeCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)

  return (
    <div className="min-h-screen bg-white px-2 py-6">
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`px-5 py-2 rounded-full font-semibold text-base transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-yellow-400 text-white shadow'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Menu Items List */}
      <div className="flex flex-col gap-6">
        {itemsToShow.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center rounded-2xl shadow-md border px-6 py-5 ${
              idx % 2 === 0
                ? 'bg-[#fffbe6] border-yellow-100'
                : 'bg-white border-gray-200'
            } cursor-pointer`}
            style={{ animationDelay: `${idx * 80}ms` }}
            onClick={() => {
              const url = `/menu/${item.id}${
                tableDataParam
                  ? `?tabledata=${encodeURIComponent(tableDataParam)}`
                  : ''
              }`
              window.location.href = url
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {item.description || 'Black coffee'}
              </div>
              <div className="text-xl font-bold text-[#4d442c] mb-1">
                {item.name}
              </div>
            </div>
            <div className="w-20 h-20 relative flex-shrink-0 ml-4">
              <Image
                src={
                  item.imageURL ||
                  item.imageURLs?.[0] ||
                  item.image ||
                  '/placeholder-food.jpg'
                }
                alt={item.name}
                fill
                className="object-cover rounded-xl border border-gray-100"
                sizes="80px"
              />
            </div>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
