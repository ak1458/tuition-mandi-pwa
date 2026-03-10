interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  prefill?: {
    name?: string
    contact?: string
    email?: string
  }
  notes?: {
    teacher_id?: string
  }
  theme?: {
    color?: string
  }
  handler?: (response: { razorpay_payment_id: string }) => void
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayCheckout {
  open: () => void
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayCheckout
}

interface Window {
  Razorpay?: RazorpayConstructor
}
