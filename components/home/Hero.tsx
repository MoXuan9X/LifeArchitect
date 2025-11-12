import Link from 'next/link'

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden px-6 py-6 lg:px-8 min-h-[90vh] flex flex-col">
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu blur-3xl">
        <div
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-40"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <img
            src="/site-icon.png"
            alt="人生教练"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-[20px] font-semibold text-white leading-none">
              LifeArchitect
            </p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link
            href="/coach"
            className="rounded-full border border-white px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-gray-900"
          >
            登录/注册
          </Link>
        </nav>
      </header>

      <div className="mx-auto mb-16 max-w-3xl text-center flex-1 flex items-center justify-center">
        <div className="space-y-10 translate-y-[10vh]">
          <h1 className="text-4xl font-semibold leading-[48px] text-white sm:text-5xl sm:leading-[60px] lg:text-6xl lg:leading-[72px]">
            AI逆袭师<br />
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#b667f7] via-[#8b5cf6] to-[#38bdf8]">
              7天
            </span>
            带你重启人生
          </h1>
          <p className="text-lg text-gray-200">
            将复杂的情绪、待办与困惑交给 AI 逆袭师，跨越焦虑与犹豫，制定可执行的重启策略，帮助你实现真正突破，不再原地打转。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/coach"
              className="rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-400"
            >
              开启向往的生活
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-200 translate-y-[-18px]">
            <div className="flex items-center gap-1">
              <span className="text-xl text-indigo-300">✓</span>
              <span>7×24小时全天候陪伴</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl text-indigo-300">✓</span>
              <span>免费即刻开启</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl text-indigo-300">✓</span>
              <span>个性化指导与行动规划</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[-16rem] -z-10 transform-gpu blur-3xl">
        <div
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-br from-[#4ade80] to-[#0ea5e9] opacity-30"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  )
}
