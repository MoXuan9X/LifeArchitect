'use client'

import Hero from '@/components/home/Hero'       // 1. 顶部 Hero 区域
import Features from '@/components/home/Features' // 2. 功能亮点区
import CTA from '@/components/home/CTA'         // 3. 底部行动号召
import Footer from '@/components/home/Footer'   // 4. 页脚
// import ThemeToggle from '@/components/ThemeToggle' // 主题切换（暂时隐藏）

export default function HomePage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen dark">
      <Hero />
      <Features />
      <CTA />
      <Footer />
      {/* <ThemeToggle /> */}
    </div>
  )
}
