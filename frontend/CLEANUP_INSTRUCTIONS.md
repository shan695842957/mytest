# 清理说明

## 问题
如果遇到以下错误：
```
✘ [ERROR] No matching export in "src/components/bms/index.ts" for import "BmsTwoLevelTopology"
src/pages/test/BMSLevel2TopologyPage.tsx:8:9
```

说明本地文件系统中还存在已删除的文件。

## 解决方案

### 方法1：同步git仓库（推荐）
```bash
cd frontend
git pull origin feature/gemini-design
# 或者
git checkout feature/gemini-design
```

### 方法2：手动删除文件
如果git pull后文件还在，手动删除：
```bash
cd frontend
rm -f src/pages/test/BMSLevel2TopologyPage.tsx
rm -f src/pages/test/BMSLevel3TopologyPage.tsx
```

### 方法3：清理Vite缓存
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

## 已删除的文件
- `frontend/src/pages/test/BMSLevel2TopologyPage.tsx`
- `frontend/src/pages/test/BMSLevel3TopologyPage.tsx`
- 所有 `designs/*.svg` 文件

这些文件在git仓库中已被删除，本地需要同步。
