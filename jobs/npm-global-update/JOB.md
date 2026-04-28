---
name: npm-global-update
cron: 0 9 * * 1
description: 每周一上午 9 点更新 npm 全局依赖
tags: [maintenance, npm]
timeout: 30
---

# npm 全局依赖更新

## 目标

每周一自动更新系统中安装的 npm 全局依赖包，保持开发环境最新。

## 执行步骤

1. 检查当前系统的 npm 全局安装列表
   ```bash
   npm list -g --depth=0
   ```

2. 执行全局更新
   ```bash
   npm update -g
   ```

3. 验证更新结果
   - 再次运行 `npm list -g --depth=0` 对比
   - 检查是否有报错

## 输出要求

记录以下信息：
- 更新前的版本列表
- 更新后的版本列表
- 任何警告或错误信息

## 注意事项

- 如果某些包需要特定版本保持不变，请先检查并跳过
- 更新失败时记录具体错误，不要影响后续执行
- 如果有重大版本变化（major version bump），额外标记并记录
