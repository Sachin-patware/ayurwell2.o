import Link from 'next/link';
import { ArrowRight, Leaf, Activity, Users, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="AyurWell Logo" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-2xl font-bold text-[#2E7D32]">AyurWell</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-[#2E7D32] font-medium transition">Features</Link>
              <Link href="#about" className="text-gray-600 hover:text-[#2E7D32] font-medium transition">About</Link>
              <Link href="/login" className="text-[#2E7D32] font-bold hover:bg-green-50 px-4 py-2 rounded-full transition">
                Login
              </Link>
              <Link href="/register" className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#1B5E20] transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2E7D32]/5 skew-x-12 transform translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-green-100 text-[#2E7D32] px-4 py-2 rounded-full font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Your Holistic Wellness Journey</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                Balance Your Life with <span className="text-[#2E7D32]">Ayurveda</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Discover personalized diet plans, track your daily progress, and connect with expert practitioners to achieve perfect harmony of body, mind, and soul.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="inline-flex justify-center items-center gap-2 bg-[#2E7D32] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1B5E20] transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Start Your Journey <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/login" className="inline-flex justify-center items-center gap-2 bg-white text-[#2E7D32] border-2 border-[#2E7D32] px-8 py-4 rounded-full font-bold text-lg hover:bg-green-50 transition">
                  Member Login
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                      U{i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">Trusted by 1000+ users</p>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition duration-500">
                <img src="/logo.jpg" alt="AyurWell Dashboard Preview" className="rounded-2xl w-full max-w-md object-cover shadow-inner" />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Leaf className="h-6 w-6 text-[#2E7D32]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Daily Status</p>
                    <p className="text-lg font-bold text-gray-900">Balanced</p>
                  </div>
                </div>
              </div>
              {/* Decorative blobs */}
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose AyurWell?</h2>
            <p className="text-lg text-gray-600">We combine ancient Ayurvedic wisdom with modern technology to provide you with a comprehensive health management solution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-green-100">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
                <Leaf className="h-7 w-7 text-[#2E7D32]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Personalized Diet Plans</h3>
              <p className="text-gray-600 leading-relaxed">
                Get customized meal recommendations based on your unique Dosha (body type) and current health goals.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-blue-100">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
                <Activity className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Log your daily water intake, meals, and symptoms. Visualize your journey with intuitive charts and insights.
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-purple-100">
              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Consultation</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with certified Ayurvedic practitioners for guidance, assessments, and personalized care plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#F1F8F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2E7D32] rounded-3xl transform rotate-3 opacity-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Ayurvedic Herbs"
                  className="relative rounded-3xl shadow-xl w-full object-cover h-[500px]"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white text-[#2E7D32] px-4 py-2 rounded-full font-semibold text-sm shadow-sm">
                <Heart className="h-4 w-4" />
                <span>Ancient Wisdom, Modern Life</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Holistic Healing for the Modern World</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Ayurveda is more than just a system of medicine; it is a way of life. It emphasizes the balance between body, mind, and spirit.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                At AyurWell, we bring this ancient wisdom to your fingertips. Whether you are looking to manage weight, improve digestion, or simply live a healthier life, our platform provides the tools and support you need.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Dosha-specific recommendations",
                  "Natural remedies and lifestyle tips",
                  "Mindfulness and yoga integration"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#2E7D32] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Transform Your Health?</h2>
          <p className="text-xl text-green-100">Join thousands of others who have discovered the power of Ayurveda with AyurWell.</p>
          <Link href="/register" className="inline-block bg-white text-[#2E7D32] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.jpg" alt="AyurWell Logo" className="h-8 w-8 rounded-lg opacity-80" />
                <span className="text-xl font-bold text-white">AyurWell</span>
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                Empowering you to live a balanced, healthy life through the wisdom of Ayurveda.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Home</Link></li>
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AyurWell. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
