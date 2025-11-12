import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import CTA from '@/components/home/CTA'
// import ThemeToggle from '@/components/ThemeToggle' // 暂时隐藏，后续开发浅色模式时再启用

export default function HomePage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen dark">
      <Hero />
      <Features />
      <CTA />
      {/* <ThemeToggle /> */}
    </div>
  )
}
