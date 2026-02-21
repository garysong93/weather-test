# 401 错误排查指南

## 步骤 1: 检查 .env.local 文件

确保项目根目录下有 `.env.local` 文件，内容为：

```
OPENWEATHER_API_KEY=e53277a152fff13f2614424e59fa0753
```

## 步骤 2: 重启开发服务器

环境变量只在服务器启动时加载，修改后必须重启：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 步骤 3: 检查 API Key 状态

访问 https://openweathermap.org/api_keys 检查：
- API Key 是否已激活（注册后最多需要2小时）
- API Key 是否正确

## 步骤 4: 查看服务器日志

启动服务器后，查看终端输出，应该能看到：
- `使用 API Key: e532...`
- 如果看到 "环境变量未设置"，说明 .env.local 未正确加载

## 步骤 5: 测试 API

在浏览器中访问：
```
http://localhost:3000/api/weather?city=Shenzhen
```

查看返回的错误信息。

## 常见错误

### 401 Unauthorized
- **API Key 未激活**：注册后需要等待最多2小时
- **API Key 错误**：检查 .env.local 中的值
- **环境变量未加载**：重启服务器

### 环境变量未设置
- 检查 .env.local 文件是否存在
- 检查文件内容格式是否正确（无引号，无空格）
- 确保已重启服务器
