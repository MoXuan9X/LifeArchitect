'use client'

type FAQItem = {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'AI逆袭师是如何帮助我的？',
    answer: 'AI逆袭师通过专业的心理学模型和结构化对话，帮你理清混乱的思绪、识别行为模式、发现突破口，并输出可执行的7天重启行动计划。不只是倾听，更提供真正的行动指导。'
  },
  {
    question: '我需要每天使用吗？',
    answer: '建议每天至少对话一次，特别是在前7天的重启期。AI逆袭师会根据你的进展调整引导策略，持续对话能让效果更显著。当然，你也可以随时在感到迷茫或需要支持时使用。'
  },
  {
    question: '我的对话内容会被保密吗？',
    answer: '是的，我们非常重视用户隐私。你的所有对话内容都会被加密存储，不会被分享给任何第三方。你可以随时清空对话记录，完全掌控自己的数据。'
  },
  {
    question: 'AI逆袭师和普通聊天机器人有什么不同？',
    answer: 'AI逆袭师不是简单的聊天工具，而是专门为人生重启设计的智能教练。它整合了心理学模型、行为分析和任务管理系统，能提供深度复盘、模式识别和个性化行动方案，而不只是回答问题。'
  },
  {
    question: '免费版本有功能限制吗？',
    answer: '目前所有核心功能都免费开放，包括无限次对话、思维整理、行为分析和行动计划生成。未来我们会推出专业版，提供更深度的分析报告和定制化服务，但基础功能将始终免费。'
  },
  {
    question: '如果AI给的建议不适合我怎么办？',
    answer: 'AI逆袭师的建议是基于你提供的信息生成的，你可以随时反馈"这个建议不适合我"或"我需要换个角度"。AI会根据你的反馈调整策略。记住，你才是自己人生的主人，AI只是陪伴和引导的工具。'
  }
]

export default function FAQs() {
  return (
    <section className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* 标题 - 居中 */}
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white text-center">
            常见问题
          </h2>

          {/* FAQ 列表 - 全部展开 */}
          <dl className="mt-16 divide-y divide-gray-900/10 dark:divide-white/10">
            {faqs.map((faq, index) => (
              <div key={index} className="py-6 first:pt-0 last:pb-0">
                <dt className="flex items-start gap-4 text-base/7 font-semibold text-gray-900 dark:text-white">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>{faq.question}</span>
                </dt>
                <dd className="mt-2 ml-12">
                  <p className="text-base/7 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

