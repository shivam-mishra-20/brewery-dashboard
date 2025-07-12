// 'use client'

// import { Plus } from 'lucide-react'
// import Image from 'next/image'
// import { useState } from 'react'
// import { Button } from '@/components/ui/button'

// const categories = ['All', 'Starters', 'Mains', 'Dessert']

// const menuItems = [
//   {
//     id: 1,
//     name: 'Classic Burger',
//     description: 'Angus beef, caramelized onions, aged cheddar, house sauce',
//     price: 320,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Mains',
//   },
//   {
//     id: 2,
//     name: 'Truffle Pasta',
//     description: 'Handmade fettuccine, black truffle, aged parmesan',
//     price: 450,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Mains',
//   },
//   {
//     id: 3,
//     name: 'Seared Salmon',
//     description: 'Norwegian salmon, asparagus, lemon butter sauce',
//     price: 520,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Mains',
//   },
//   {
//     id: 4,
//     name: 'Lava Cake',
//     description: 'Dark chocolate, vanilla bean ice cream, fresh berries',
//     price: 280,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Dessert',
//   },
//   {
//     id: 5,
//     name: 'Bruschetta',
//     description: 'Artisan sourdough, heirloom tomatoes, fresh basil, EVOO',
//     price: 220,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Starters',
//   },
//   {
//     id: 6,
//     name: 'House IPA',
//     description: 'Signature craft beer, citrus notes, medium body',
//     price: 180,
//     image: '/placeholder.svg?height=120&width=180',
//     category: 'Starters',
//   },
// ]

// export default function Component() {
//   const [selectedCategory, setSelectedCategory] = useState('All')

//   const filteredItems =
//     selectedCategory === 'All'
//       ? menuItems
//       : menuItems.filter((item) => item.category === selectedCategory)

//   return (
//     <div className="min-h-screen bg-[#0b3d2e] text-white p-6">
//       <div className="max-w-md mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-serif mb-2">Good Evening,</h1>
//           <p className="text-lg opacity-90">Order Something Special</p>
//         </div>

//         {/* Category Filter */}
//         <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
//           {categories.map((category) => (
//             <Button
//               key={category}
//               variant={selectedCategory === category ? 'default' : 'outline'}
//               className={`rounded-full px-6 py-2 whitespace-nowrap border-2 transition-all ${
//                 selectedCategory === category
//                   ? 'bg-[#f2a365] text-[#0b3d2e] border-[#f2a365] hover:bg-[#f2a365]/90'
//                   : 'bg-transparent text-[#f2a365] border-[#f2a365] hover:bg-[#f2a365]/10'
//               }`}
//               onClick={() => setSelectedCategory(category)}
//             >
//               {category}
//             </Button>
//           ))}
//         </div>

//         {/* Menu Items Grid */}
//         <div className="grid grid-cols-2 gap-4">
//           {filteredItems.map((item) => (
//             <div
//               key={item.id}
//               className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm"
//             >
//               {/* Food Image */}
//               <div className="bg-black rounded-xl mb-3 overflow-hidden">
//                 <Image
//                   src={item.image || '/placeholder.svg'}
//                   alt={item.name}
//                   width={180}
//                   height={120}
//                   className="w-full h-24 object-cover"
//                 />
//               </div>

//               {/* Item Details */}
//               <div className="space-y-2">
//                 <h3 className="font-semibold text-white text-sm leading-tight">
//                   {item.name}
//                 </h3>
//                 <p className="text-xs text-[#ced4da] leading-tight line-clamp-2">
//                   {item.description}
//                 </p>

//                 {/* Price and Add Button */}
//                 <div className="flex items-center justify-between pt-1">
//                   <span className="text-[#f2a365] font-semibold">
//                     ₹{item.price}
//                   </span>
//                   <Button
//                     size="sm"
//                     className="bg-[#f2a365] hover:bg-[#f2a365]/90 text-[#0b3d2e] rounded-full w-6 h-6 p-0"
//                   >
//                     <Plus className="w-3 h-3" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }
