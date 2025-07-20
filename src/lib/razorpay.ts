/**
 * Razorpay Integration Utility
 * Handles loading the Razorpay script and opening the payment modal
 */

// Declare the Razorpay type
declare global {
  interface Window {
    Razorpay: any
  }
}

/**
 * Load the Razorpay script dynamically
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true)
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Open Razorpay payment modal
 */
export const openRazorpayCheckout = async (options: {
  key: string
  amount: number // amount in paisa
  currency: string
  name: string
  description: string
  order_id: string
  prefill: {
    name: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler?: (response: any) => void
}): Promise<any> => {
  // Load Razorpay script if not already loaded
  const isScriptLoaded = await loadRazorpayScript()
  if (!isScriptLoaded) {
    throw new Error('Failed to load Razorpay script')
  }

  return new Promise((resolve, reject) => {
    try {
      const razorpay = new window.Razorpay({
        ...options,
        handler: (response: any) => {
          if (options.handler) {
            options.handler(response)
          }
          resolve(response)
        },
      })

      // Open Razorpay checkout modal
      razorpay.open()
    } catch (error) {
      console.error('Razorpay initialization error:', error)
      reject(error)
    }
  })
}
