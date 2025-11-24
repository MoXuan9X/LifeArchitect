'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function WelcomeDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // 检查是否已经显示过欢迎弹窗
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        {/* 弹窗内容 */}
        <div className="px-8 py-8 text-center">
          {/* 标题 */}
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              欢迎使用 AI逆袭师！
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mb-8">
              AI逆袭师会通过对话深度理解你的困境，帮助你梳理思路、制定计划，7天带你走出迷茫。
            </DialogDescription>
          </DialogHeader>

          {/* 功能介绍列表 */}
          <div className="space-y-6 mb-8 text-left">
            {/* 第1项 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pink-600 dark:text-pink-400">5</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  思维整理分析
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  对话5轮后，AI会帮你梳理混乱的想法，理清头绪
                </p>
              </div>
            </div>

            {/* 第2项 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pink-600 dark:text-pink-400">10</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  行为模式分析
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  对话10轮后，发现你的行为模式和思维盲区
                </p>
              </div>
            </div>

            {/* 第3项 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pink-600 dark:text-pink-400">15</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  突破口识别
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  对话15轮后，找到适合你的突破口和行动切入点
                </p>
              </div>
            </div>

            {/* 第4项 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pink-600 dark:text-pink-400">20</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  个性化重启路线图
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  对话20轮后，生成专属的7天重启行动计划
                </p>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <Button
            onClick={handleClose}
            className="w-full h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 rounded-full transition-colors"
          >
            开始使用
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

