import { redirect } from 'next/navigation'

export default function SignUpPage() {
  const hasClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk')

  if (!hasClerk) {
    redirect('/dashboard')
  }

  const ClerkSignUp = require('@clerk/nextjs').SignUp
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4">LA</div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Free forever with Groq & Gemini AI</p>
        </div>
        <ClerkSignUp appearance={{ variables: { colorPrimary: '#6366f1' } }} />
      </div>
    </div>
  )
}
