type Feature = {
  title: string
  subtitle: string
  description: string
  details: string
}

const featureCards: Feature[] = [
  {
    title: '思维整理',
    subtitle: '倾听与复盘',
    description:
      '把睡前纠结、待办、愿望等统一导入 AI 逆袭师，匹配适合的引导与解决路径。',
    details:
      '无论是深夜的焦虑情绪，还是白天积累的待办事项，AI逆袭师都能帮你理清头绪。通过结构化的对话引导，将混乱的想法转化为清晰的行动方向，让你从"不知道该做什么"到"知道怎么做"。',
  },
  {
    title: '拓展视角',
    subtitle: '多角度策略',
    description:
      '结合角色模型、场景扮演、时间轴让你看到潜在突破口，提升决策信心。',
    details:
      '当你陷入思维死胡同时，AI逆袭师会从不同角色和时间维度帮你重新审视问题。通过换位思考和场景模拟，发现被忽略的可能性，让你在决策时不再犹豫不决，而是充满信心地迈出下一步。',
  },
  {
    title: '行为重启',
    subtitle: '与行动同步',
    description:
      '结合代办与心理模型，输出可执行计划，记录进展并在下一次对话复盘。',
    details:
      '光有想法还不够，AI逆袭师会帮你制定具体可执行的行动计划。每一步都清晰可见，进度实时追踪，下次对话时还能复盘成长。让改变不再停留在口头，而是真正落地到生活的每一天。',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative z-8 bg-white dark:bg-gray-900 py-18 sm:py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* 功能卡片网格 */}
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 小标题 */}
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                {feature.title}
              </p>
              
              {/* 主标题 */}
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {feature.subtitle}
              </h3>
              
              {/* 简短描述 */}
              <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
              
              {/* 详细说明 */}
              <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {feature.details}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
