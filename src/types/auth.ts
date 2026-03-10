export type AuthMethod = 'phone_otp' | 'email_password' | null

export interface AppSession {
  user: {
    id: string
    phone?: string
    email?: string
    user_metadata?: Record<string, unknown>
  }
}

export interface AuthContextValue {
  session: AppSession | null
  authMethod: AuthMethod
  isLoading: boolean
  requestPhoneOtp: (phoneNumber: string) => Promise<void>
  verifyPhoneOtp: (phoneNumber: string, otpCode: string) => Promise<void>
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
