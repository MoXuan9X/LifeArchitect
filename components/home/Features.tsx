type Feature = {
  title: string
  subtitle: string
  description: string
}

const featureCards: Feature[] = [
  {
    title: '思维整理',
    subtitle: '倾听与复盘',
    description:
      '把睡前纠结、待办、愿望等统一导入 AI 逆袭师，匹配适合的引导与解决路径。',
  },
  {
    title: '拓展视角',
    subtitle: '多角度策略',
    description:
      '结合角色模型、场景扮演、时间轴让你看到潜在突破口，提升决策信心。',
  },
  {
    title: '行为重启',
    subtitle: '与行动同步',
    description:
      '结合代办与心理模型，输出可执行计划，记录进展并在下一次对话复盘。',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative z-10 px-6 pb-16 pt-10 lg:px-8 ">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {featureCards.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-6 text-left"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-200">
              {feature.title}
            </p>
            <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{feature.subtitle}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
