export default function Home() {
  return (
    <main className="text-center py-12">
      <h2 className="text-3xl font-extrabold text-gray-900">User & Agent Activity Tracking</h2>
      <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Prototype project with registration, OTP verification, activity pings, session tracking and agent visit reports. Use the Register/Login links to try out the APIs.</p>
      <div className="mt-8 flex justify-center gap-4">
        <a href="/register" className="px-5 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-500">Register</a>
        <a href="/login" className="px-5 py-3 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50">Login</a>
      </div>
    </main>
  )
}
