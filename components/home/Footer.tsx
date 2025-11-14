import Link from 'next/link'

// 导航链接配置
const navigation = {
  product: [
    { name: '功能介绍', href: '#features' },
    { name: '使用场景', href: '/coach' },
    { name: '常见问题', href: '#' },
  ],
  support: [
    { name: '帮助中心', href: '#' },
    { name: '用户协议', href: '#' },
    { name: '隐私政策', href: '#' },
  ],
  company: [
    { name: '关于我们', href: '#' },
    { name: '联系方式', href: '#' },
    { name: '加入我们', href: '#' },
  ],
}

// 社交媒体配置
const socialLinks = [
  {
    name: '微信公众号',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
        <path d="M8.5 12c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm5.5-1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm4.5-8.5c-4.14 0-7.5 2.91-7.5 6.5 0 1.43.53 2.75 1.43 3.81-.31.94-.91 2.47-1.13 2.87-.05.09-.03.19.03.26.06.07.16.1.25.08.74-.16 2.67-.94 3.47-1.36.63.13 1.29.19 1.95.19 4.14 0 7.5-2.91 7.5-6.5S22.64 2.5 18.5 2.5zM9.5 15c-3.59 0-6.5-2.46-6.5-5.5 0-1.2.39-2.31 1.04-3.27C2.16 7.56 1 9.66 1 12c0 2.19 1.35 4.09 3.35 5.18-.19.6-.72 1.96-.9 2.28-.04.07-.03.15.02.21.05.05.13.08.2.06.59-.13 2.13-.75 2.77-1.09.5.1 1.03.15 1.56.15 2.45 0 4.61-1.2 5.96-2.97-.77.08-1.56.13-2.35.13z"/>
      </svg>
    ),
  },
  {
    name: '微博',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
        <path d="M9.5 14.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5c.17 0 .34.01.5.04-.27-.68-.42-1.43-.42-2.21C9.08 2.86 11.44.5 14.4.5c2.07 0 3.87 1.18 4.76 2.9.16-.02.32-.03.49-.03 1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5c-.17 0-.34-.02-.5-.05.27.68.42 1.43.42 2.21 0 2.96-2.36 5.37-5.32 5.37-2.07 0-3.87-1.18-4.76-2.9-.16.02-.32.03-.49.03zm8.15-8.85c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" fillRule="evenodd" />
      </svg>
    ),
  },
  {
    name: '邮箱',
    href: 'mailto:hello@lifearchitect.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:py-10 lg:px-8">
        {/* 主要内容区：Logo 左对齐，导航右对齐 */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          {/* Logo 区域 - 左对齐 */}
          <div className="flex-shrink-0">
            <Link href="/" className="inline-flex items-center gap-2">
              <img
                src="/site-icon.png"
                alt="AI逆袭师"
                className="h-10 w-10"
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                LifeArchitect
              </span>
            </Link>
            {/* 版权信息 - Logo 下方，左对齐 */}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-left">
              &copy; {new Date().getFullYear()} LifeArchitect. 保留所有权利 · 让每一天都成为重启的开始
            </p>
          </div>

          {/* 导航链接区域 - 右对齐 */}
          <nav className="flex-shrink-0 mr-10 lg:mr-20" aria-label="Footer">
            <div className="grid grid-cols-1 gap-56 sm:grid-cols-3">
              {/* 产品 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  产品
                </h3>
                <ul className="space-y-2">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-indigo-600 transition dark:text-gray-400 dark:hover:text-indigo-400"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 支持 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  支持
                </h3>
                <ul className="space-y-2">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-indigo-600 transition dark:text-gray-400 dark:hover:text-indigo-400"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 公司 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  公司
                </h3>
                <ul className="space-y-2">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-indigo-600 transition dark:text-gray-400 dark:hover:text-indigo-400"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  )
}
