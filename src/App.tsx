import React, { useState } from 'react'
import PCSVisualization, {
  type PCSMode,
  type ThemeMode,
  type GridSideData,
  type DCSideData,
  type PCSData,
} from './components/PCSVisualization'

function App() {
  const [mode, setMode] = useState<PCSMode>('charging')
  const [theme, setTheme] = useState<ThemeMode>('light')

  // 示例数据：网侧数据
  const gridSideData: GridSideData = {
    label: '网侧参数',
    voltage: 380,
    current: 50,
    power: 19,
    frequency: 50,
  }

  // 示例数据：直流侧数据
  const dcSideData: DCSideData = {
    label: '直流侧参数',
    voltage: 600,
    current: 32,
    power: 19.2,
  }

  // 示例数据：PCS数据
  const pcsData: PCSData = {
    label: 'PCS状态',
    efficiency: 95.5,
    temperature: 45,
    status: mode === 'charging' ? '充电中' : mode === 'discharging' ? '放电中' : '待机',
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundColor: theme === 'light' ? '#f5f5f5' : '#121212',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: theme === 'light' ? '#212121' : '#ffffff' }}>
          储能系统PCS可视化示例
        </h1>

        {/* 控制面板 */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1e1e1e' }}>
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className="block text-sm mb-2" style={{ color: theme === 'light' ? '#212121' : '#ffffff' }}>
                运行模式：
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PCSMode)}
                className="px-4 py-2 rounded border"
                style={{
                  backgroundColor: theme === 'light' ? '#ffffff' : '#2e2e2e',
                  color: theme === 'light' ? '#212121' : '#ffffff',
                  borderColor: theme === 'light' ? '#ccc' : '#555',
                }}
              >
                <option value="charging">充电模式</option>
                <option value="discharging">放电模式</option>
                <option value="idle">空闲模式</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: theme === 'light' ? '#212121' : '#ffffff' }}>
                主题：
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="px-4 py-2 rounded border"
                style={{
                  backgroundColor: theme === 'light' ? '#ffffff' : '#2e2e2e',
                  color: theme === 'light' ? '#212121' : '#ffffff',
                  borderColor: theme === 'light' ? '#ccc' : '#555',
                }}
              >
                <option value="light">明亮</option>
                <option value="dark">暗黑</option>
              </select>
            </div>
          </div>
        </div>

        {/* PCS可视化组件 */}
        <div className="relative" style={{ backgroundColor: 'transparent' }}>
          <PCSVisualization
            mode={mode}
            theme={theme}
            gridSideData={gridSideData}
            dcSideData={dcSideData}
            pcsData={pcsData}
            width={800}
            height={400}
            animationDuration={2000}
          />
        </div>

        {/* 使用说明 */}
        <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1e1e1e' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme === 'light' ? '#212121' : '#ffffff' }}>
            使用说明
          </h2>
          <div className="space-y-2 text-sm" style={{ color: theme === 'light' ? '#757575' : '#b0b0b0' }}>
            <p>• 组件支持三种运行模式：充电、放电、空闲</p>
            <p>• 充电模式：能量从网侧（交流）流向直流侧</p>
            <p>• 放电模式：能量从直流侧流向网侧（交流）</p>
            <p>• 可通过接口传入网侧、直流侧和PCS的实时数据</p>
            <p>• 支持明暗主题切换，背景透明，可适配网页背景</p>
            <p>• 所有数据展示区域都支持自定义内容（customContent）</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
