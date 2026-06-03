import { appEnv } from '@/lib/env'

export interface OpenRazorpayCheckoutInput {
  amountPaise: number
  description: string
  teacherId?: string
  teacherName?: string
  teacherPhone?: string
  teacherEmail?: string
  onSuccess: (paymentId: string) => Promise<void> | void
}

let razorpayScriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only run in browser'))
  }

  if (window.Razorpay) {
    return Promise.resolve()
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay="checkout"]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Razorpay script load failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = 'checkout'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay script load failed'))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export async function openRazorpayCheckout(input: OpenRazorpayCheckoutInput): Promise<string> {
  if (!appEnv.razorpayKey) {
    throw new Error('Razorpay key missing. Add VITE_RAZORPAY_KEY.')
  }

  await loadRazorpayScript()

  if (!window.Razorpay) {
    throw new Error('Razorpay not available')
  }

  const RazorpayCheckout = window.Razorpay

  return new Promise((resolve, reject) => {
    const checkout = new RazorpayCheckout({
      key: appEnv.razorpayKey,
      amount: input.amountPaise,
      currency: 'INR',
      name: 'TuitionMandi',
      description: input.description,
      prefill: {
        name: input.teacherName,
        contact: input.teacherPhone,
        email: input.teacherEmail,
      },
      notes: {
        teacher_id: input.teacherId,
      },
      theme: {
        color: '#E07A2F',
      },
      handler: async (response) => {
        try {
          await input.onSuccess(response.razorpay_payment_id)
          resolve(response.razorpay_payment_id)
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Plan upgrade failed'))
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    })

    checkout.open()
  })
}
