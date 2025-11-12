import Link from 'next/link'

export default function Hero() {
  return (
    // 【Hero 最外层容器】整个首页 Hero 区域的根容器
    // px-6: 左右内边距 24px | pt-6: 顶部内边距 24px | min-h-[90vh]: 最小高度 90% 视口
    // flex flex-col: 垂直弹性布局 | relative: 相对定位（为内部绝对定位元素提供参考）
    // bg-white: 浅色模式白色背景 | dark:bg-gray-900: 深色模式深灰背景
    <div className="relative isolate overflow-hidden bg-white dark:bg-gray-900 px-6 pt-6 lg:px-8 min-h-[90vh] flex flex-col">
      
      {/* 【顶部装饰渐变】页面顶部的粉紫色模糊渐变背景 */}
      {/* absolute: 绝对定位 | top-[-10rem]: 向上偏移 160px（从屏幕外开始）*/}
      {/* -z-10: 在所有内容后面 | blur-3xl: 超大模糊效果 */}
      {/* 浅色模式透明度 30%，深色模式 40% */}
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu blur-3xl">
        {/* 渐变形状容器：从粉色到紫色的渐变 */}
        <div
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 dark:opacity-40"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* 【顶部导航栏】包含 Logo 和登录按钮 */}
      {/* flex: 弹性布局 | justify-between: 左右两端对齐 | z-10: 在渐变背景之上 */}
      <header className="flex relative z-10 justify-between items-center">
        {/* Logo 区域（左侧） */}
        <div className="flex gap-3 items-center text-gray-900 dark:text-white">
          {/* Logo 图标 */}
          <img
            src="/site-icon.png"
            alt="AI逆袭师"
            className="object-contain w-10 h-10"
          />
          {/* Logo 文字 */}
          <div>
            <p className="text-[22px] font-semibold text-gray-900 dark:text-white leading-none">
              LifeArchitect 
            </p>
          </div>
        </div>
        {/* 导航菜单（右侧，仅大屏显示） */}
        <nav className="hidden gap-6 items-center text-sm font-medium lg:flex">
          <Link
            href="/coach"
            className="px-4 py-2 text-sm font-semibold rounded-full border border-gray-900 dark:border-white text-gray-900 dark:text-white transition hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900"
          >
            登录/注册
          </Link>
        </nav>
      </header>

      {/* 【主内容区】占据剩余空间，垂直水平居中 */}
      {/* flex-1: 占据剩余空间 | items-center: 内容垂直居中 | max-w-3xl: 最大宽度 768px */}
      {/* mb-16: 底部外边距 64px */}
      <div className="flex flex-1 justify-center items-center mx-auto mb-16 max-w-3xl text-center">
        
        {/* 【内容包裹容器】所有文字内容的直接父容器 */}
        {/* space-y-10: 子元素垂直间距 40px | translate-y-[10vh]: 向下偏移 10% 视口高度 */}
        <div className="space-y-10 translate-y-[10vh]">
          
          {/* 【主标题】"AI逆袭师 7天带你重启人生" */}
          {/* 响应式字号：基础 36px → 小屏 48px → 大屏 60px */}
          {/* 浅色模式深色文字，深色模式白色文字 */}
          <h1 className="text-4xl font-semibold leading-[48px] text-gray-900 dark:text-white sm:text-5xl sm:leading-[60px] lg:text-6xl lg:leading-[72px]">
            AI逆袭师<br />
            {/* "7天" 文字渐变效果：紫色到蓝色 */}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#b667f7] via-[#8b5cf6] to-[#38bdf8]">
              7天
            </span>
            带你重启人生
          </h1>
          
          {/* 【描述段落】产品介绍文字 */}
          {/* text-lg: 字号 18px | 浅色模式灰色，深色模式浅灰 */}
          <p className="text-lg text-gray-600 dark:text-gray-200">
            将复杂的情绪、待办与困惑交给 AI 逆袭师，跨越焦虑与犹豫，制定可执行的重启策略，帮助你实现真正突破，不再原地打转。
          </p>
          
          {/* 【按钮容器】包含主要 CTA 按钮 */}
          {/* flex-wrap: 允许换行 | gap-4: 按钮间距 16px */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {/* 主要操作按钮 */}
            <Link
              href="/coach"
              className="px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-full shadow-lg transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              开启向往的生活
            </Link>
          </div>
          
          {/* 【特性列表】三个勾选项 */}
          {/* text-xs: 小字号 12px | translate-y-[-18px]: 向上移动 18px（靠近按钮）*/}
          {/* 浅色模式用 indigo-600/700，深色模式用 indigo-200/300 */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-600 dark:text-indigo-200 translate-y-[-18px]">
            {/* 特性项 1 */}
            <div className="flex gap-1 items-center">
              <span className="text-xl text-indigo-700 dark:text-indigo-300">✓</span>
              <span>7×24小时全天候陪伴</span>
            </div>
            {/* 特性项 2 */}
            <div className="flex gap-1 items-center">
              <span className="text-xl text-indigo-700 dark:text-indigo-300">✓</span>
              <span>免费即刻开启</span>
            </div>
            {/* 特性项 3 */}
            <div className="flex gap-1 items-center">
              <span className="text-xl text-indigo-700 dark:text-indigo-300">✓</span>
              <span>个性化指导与行动规划</span>
            </div>
          </div>
        </div>
      </div>

      {/* 【底部装饰渐变】页面底部的绿蓝色模糊渐变背景 */}
      {/* bottom-[-16rem]: 向下偏移 256px（延伸到屏幕外）*/}
      <div className="absolute inset-x-0 bottom-[-16rem] -z-10 transform-gpu blur-3xl">
        {/* 渐变形状容器：从绿色到蓝色的渐变 */}
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
