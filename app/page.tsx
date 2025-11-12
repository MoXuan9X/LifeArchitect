import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="relative isolate overflow-hidden px-6 py-6 lg:px-8 min-h-[90vh] flex flex-col">
        <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu blur-3xl">
          <div
            className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-40"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}
          />
        </div>

        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <img 
              src="/site-icon.png" 
              alt="AI逆袭师" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-lg font-semibold text-white leading-none">
                AI · 逆袭师
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
              AI逆袭师<br />你的人生重启教练
            </h1>
            <p className="text-lg text-gray-200">
              将复杂的情绪、待办与困惑交给 AI 逆袭师，跨越焦虑与犹豫，制定可执行的重启策略，帮助你实现真正突破，不再原地打转。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/coach"
                className="rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-400"
              >
                开始重启人生
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-200">
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
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}
          />
        </div>
      </div>

      <section id="features" className="relative z-10 px-6 pb-16 pt-10 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              思维整理
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              倾听与复盘
            </p>
            <p className="mt-2 text-sm text-gray-300">
              把睡前纠结、待办、愿望等统一导入 AI 逆袭师，匹配适合的引导与解决路径。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              拓展视角
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              多角度策略
            </p>
            <p className="mt-2 text-sm text-gray-300">
              结合角色模型、场景扮演、时间轴让你看到潜在突破口，提升决策信心。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              行为重启
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              与行动同步
            </p>
            <p className="mt-2 text-sm text-gray-300">
              结合代办与心理模型，输出可执行计划，记录进展并在下一次对话复盘。
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
            AI 逆袭师，一键重启人生
          </p>
          <p className="mt-4 text-xl font-semibold text-white">
            通过开放式对话陪伴、任务清单引导和模型化复盘，让你从迷茫、焦虑中抽离，稳步迈向新的自己。
          </p>
          <p className="mt-4 text-base text-gray-200">
            AI逆袭师集成多种心理工具与任务流程，仅需 5 分钟，就能帮你整理当下的困境和下一步行动，成为你的人生重启教练。
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/coach"
              className="rounded-full border border-white px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-gray-900"
            >
              马上访问功能页
            </Link>
            <Link
              href="/coach"
              className="text-sm font-semibold text-gray-200 underline-offset-4 hover:text-white"
            >
              查看即刻体验
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
