# 免费 3D 动物模型下载指南

## 🎯 推荐的免费模型网站

### 1. **Sketchfab** (最推荐)
- 网址：https://sketchfab.com
- 搜索关键词：`low poly animal`、`cute animal`、`game character`
- 格式：支持 GLTF/GLB 下载
- 优点：质量高，很多免费模型
- 注意：需要注册账号，选择 "Downloadable" 和 "Free" 筛选

### 2. **Poly Haven** (完全免费)
- 网址：https://polyhaven.com/models
- 优点：完全免费，无需注册，CC0 许可（可商用）
- 格式：GLTF/GLB
- 缺点：动物模型相对较少

### 3. **Mixamo** (Adobe 官方)
- 网址：https://www.mixamo.com
- 优点：免费角色模型 + 动画
- 格式：FBX（需要转换）或直接下载带动画的 GLTF
- 注意：主要是人物，但也有一些动物角色

### 4. **TurboSquid** (部分免费)
- 网址：https://www.turbosquid.com
- 搜索时勾选 "Free" 筛选
- 格式：多种格式，优先选择 GLTF/GLB

### 5. **CGTrader** (部分免费)
- 网址：https://www.cgtrader.com
- 搜索时选择 "Free" 筛选
- 格式：GLTF/GLB

## 📥 下载步骤

1. **访问网站** → 搜索 "low poly pig" 或 "cute pig gltf"
2. **筛选条件**：
   - ✅ Free（免费）
   - ✅ GLTF 或 GLB 格式
   - ✅ Low Poly（低多边形，性能好）
3. **下载文件** → 保存为 `.glb` 或 `.gltf` 格式
4. **放置文件** → 放到项目的 `public/assets/models/` 目录

## 🔧 集成到项目

下载模型后，按照以下步骤：

1. **创建 models 目录**：
   ```bash
   mkdir -p public/assets/models
   ```

2. **放置模型文件**：
   - `pig.glb`
   - `rabbit.glb`
   - `cat.glb`
   - `dog.glb`

3. **代码会自动加载**（已创建 ModelLoader.js）

## 💡 快速测试方案

如果暂时找不到合适的模型，可以先使用这些在线模型 URL 测试：

- 小猪：https://models.readyplayer.me/... (需要找公开的 GLTF URL)
- 或者使用 Three.js 官方的示例模型测试

## ⚠️ 注意事项

1. **文件大小**：GLB 文件建议 < 2MB，否则加载慢
2. **面数**：选择 Low Poly（低多边形），面数 < 5000
3. **许可**：确认模型是免费可商用的（CC0 或 CC-BY）
4. **格式**：优先选择 GLB（二进制，文件更小）而不是 GLTF（文本+贴图）
