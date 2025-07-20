Here's a patch to fix the double-adding issue in the cart functionality:

1. Update the `handleAddToCart` function:

```javascript
// Add to cart logic - FIXED VERSION
const handleAddToCart = () => {
  // Check if we can add to cart
  if (!item || isAdding || addToCartRef.current) return

  // Set flags to prevent multiple adds
  setIsAdding(true)
  addToCartRef.current = true

  // Use a local variable to store the current quantity
  const qtyToAdd = quantity

  // Reset quantity first
  setQuantity(1)

  // Add the item to the cart
  addToCart({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: qtyToAdd,
    addOns: item.addOns?.filter((a) => selectedAddOns.includes(a.name)) || [],
    image: item.imageURLs?.[0] || item.imageURL || '',
  })

  // Reset flags after a delay
  setTimeout(() => {
    setIsAdding(false)
    addToCartRef.current = false
  }, 500) // Longer delay to ensure operation completes
}
```

2. Add the useRef for tracking cart operations:

```javascript
// At the top of your component with other state declarations
const addToCartRef = useRef(false) // Use a ref to track add to cart state
```

3. Update the Add to Order button with loading state:

```jsx
<button
  className={`w-[95%] max-w-md py-4 shadow-inner shadow-white/[0.5] rounded-2xl font-extrabold text-lg tracking-wide font-inter relative overflow-hidden transition-all duration-300 product-add-to-order-btn ${
    item.available && !isAdding
      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-white hover:scale-[1.02]'
      : 'bg-gray-300 cursor-not-allowed text-gray-500'
  }`}
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto',
  }}
  disabled={!item.available || isAdding}
  onClick={handleAddToCart}
>
  {/* Add shine effect for available items */}
  {item.available && !isAdding && (
    <span className="absolute inset-0 overflow-hidden">
      <span className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine"></span>
    </span>
  )}

  <div className="flex items-center justify-center">
    {item.available ? (
      isAdding ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Adding...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {getCartQuantity() > 0
            ? `In Cart: ${getCartQuantity()} - Add ${quantity} More`
            : `Add to Order (${quantity})`}
        </>
      )
    ) : (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Currently Unavailable
      </>
    )}
  </div>
</button>
```

Follow these steps to fix the issue:

1. Add the useRef declaration (`addToCartRef`) at the top of your component with the other state declarations
2. Replace the existing `handleAddToCart` function with the new implementation
3. Update the button to show a loading state during the add operation

This implementation fixes the double-adding issue by:

- Using both a state variable and a ref to double-protect against multiple clicks
- Capturing the quantity value locally before modifying state
- Increasing the debounce timeout to 500ms
- Showing a loading state with animation during the add operation
- Disabling the button completely during the add operation
- Setting quantity to 1 earlier in the process to avoid stale state
