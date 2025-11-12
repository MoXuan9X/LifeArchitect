import Link from 'next/link'

export default function CTA() {
  return (
    <section className="relative z-10 px-6 pb-16 lg:px-8">
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
  )
}
