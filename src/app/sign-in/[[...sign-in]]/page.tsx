import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4">LA</div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your ListingAI account</p>
        </div>
        <SignIn appearance={{ variables: { colorPrimary: '#6366f1' } }} />
      </div>
    </div>
  )
}
