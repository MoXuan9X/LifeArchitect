import Link from 'next/link'

export default function CTA() {
  return (
    <div className="relative isolate overflow-hidden bg-white dark:bg-gray-900">
      <div className="px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {/* 主标题 */}
          <h2 className="text-4xl font-semibold tracking-tight leading-tight text-balance text-gray-900 sm:text-5xl sm:leading-tight dark:text-white">
            从 摆烂 到 逆袭<br />现在开始重启人生
          </h2>
          
          {/* 描述文字 */}
          <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-600 dark:text-gray-300">
            每一次深夜的自我怀疑，每一个被拖延的计划，都在消耗你的生命力。AI逆袭师用专业陪伴打破焦虑循环，7天带你找回掌控感。
          </p>
          
          {/* 按钮组 */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/coach"
              className="rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              立即开始重启
            </Link>
          </div>
        </div>
      </div>
      
      {/* 背景装饰渐变 - 与 Hero 保持一致的粉紫配色 */}
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 size-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
      >
        <circle
          r="512"
          cx="512"
          cy="512"
          fill="url(#cta-gradient)"
          fillOpacity="0.5"
        />
        <defs>
          <radialGradient id="cta-gradient">
            <stop stopColor="#ff80b5" />
            <stop offset="1" stopColor="#9089fc" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
