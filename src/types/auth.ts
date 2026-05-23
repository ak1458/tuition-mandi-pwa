export type AuthMethod = 'phone_otp' | 'email_password' | 'google_oauth' | null

export interface AppSession {
  user: {
    id: string
    phone?: string
    email?: string
    user_metadata?: Record<string, unknown>
  }
}

export interface ConsentPayload {
  acceptedAt: string
  ageVerified: boolean
  termsVersion: string
}

export interface AuthContextValue {
  session: AppSession | null
  authMethod: AuthMethod
  isLoading: boolean
  requestPhoneOtp: (phoneNumber: string) => Promise<void>
  verifyPhoneOtp: (phoneNumber: string, otpCode: string, consent?: ConsentPayload) => Promise<void>
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, consent?: ConsentPayload) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  signInWithGoogle: (consent?: ConsentPayload) => Promise<void>
  signOut: () => Promise<void>
}
