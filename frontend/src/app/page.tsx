import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <h1 className="text-5xl font-bold mb-8">Welcome to Ayurwell</h1>
      <p className="text-xl mb-8">Your Ayurvedic Health Companion</p>
      <div className="space-x-4">
        <Link href="/login" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-gray-100 transition">
          Login
        </Link>
        <Link href="/register" className="px-6 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-indigo-600 transition">
          Register
        </Link>
      </div>
    </div>
  );
}
