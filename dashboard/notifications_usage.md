# Rainhoole Dashboard 通知系统使用文档

## 简介

Rainhoole Dashboard 通知系统提供了一套完整的通知解决方案，包括浏览器通知和应用内通知。它支持不同类型的通知（成功、警告、错误、信息），并提供通知历史记录和配置选项。

## 功能特性

- **浏览器通知**: 当应用失去焦点时，通过浏览器发送通知。
- **应用内通知**: 在应用界面内显示通知。
- **通知类型**: 支持成功、警告、错误和信息四种类型的通知，每种类型都有不同的样式和图标。
- **通知历史**: 记录所有通知，方便用户查看。
- **通知设置**: 允许用户自定义通知的行为，例如是否启用浏览器通知、声音、自动隐藏等。

## 使用方法

### 1. 初始化

在页面加载完成后，通知系统会自动初始化。您也可以手动调用 `NotificationSystem.init()` 方法进行初始化。

### 2. 显示通知

使用 `NotificationSystem.show()` 方法显示通知。该方法接受一个配置对象，包含以下属性：

- `type`: 通知类型 (可选，默认为 'info')，可选值包括 'success'、'warning'、'error' 和 'info'。
- `title`: 通知标题 (可选)。
- `message`: 通知内容。
- `persistent`: 是否持久显示 (可选，默认为 `false`)。如果设置为 `true`，则通知不会自动隐藏。
- `duration`: 通知显示时长 (可选，默认为 5000 毫秒)。
- `onclick`: 点击通知时的回调函数 (可选)。

#### 示例

```javascript
NotificationSystem.show({
    type: 'success',
    title: '操作成功',
    message: '数据已成功保存！'
});
```

### 3. 快捷方法

通知系统提供了一系列快捷方法，用于显示不同类型的通知：

- `NotificationSystem.success(message, title)`: 显示成功通知。
- `NotificationSystem.warning(message, title)`: 显示警告通知。
- `NotificationSystem.error(message, title)`: 显示错误通知。
- `NotificationSystem.info(message, title)`: 显示信息通知。

#### 示例

```javascript
NotificationSystem.success('数据已成功保存！', '操作成功');
```

### 4. 关闭通知

- `NotificationSystem.dismiss(id)`: 关闭指定 ID 的通知。
- `NotificationSystem.dismissAll()`: 关闭所有当前显示的通知。

### 5. 获取和清空历史记录

- `NotificationSystem.getHistory()`: 获取通知历史记录。
- `NotificationSystem.clearHistory()`: 清空通知历史记录。

### 6. 更新配置

使用 `NotificationSystem.updateConfig()` 方法更新通知系统的配置。该方法接受一个配置对象，包含以下属性：

- `browserNotifications`: 是否启用浏览器通知 (默认为 `true`)。
- `inAppNotifications`: 是否启用应用内通知 (默认为 `true`)。
- `sound`: 是否播放声音 (默认为 `true`)。
- `autoHide`: 是否自动隐藏通知 (默认为 `true`)。
- `hideDelay`: 自动隐藏的延迟时间 (默认为 5000 毫秒)。
- `maxNotifications`: 最大通知数量 (默认为 50)。
- `showTimestamps`: 是否显示时间戳 (默认为 `true`)。
- `position`: 通知显示位置 (默认为 'top-right')，可选值包括 'top-right'、'top-left'、'bottom-right' 和 'bottom-left'。

#### 示例

```javascript
NotificationSystem.updateConfig({
    browserNotifications: false,
    sound: false
});
```

### 7. 获取配置

使用 `NotificationSystem.getConfig()` 方法获取当前的通知系统配置。

## UI 方法

- `NotificationSystem.openPanel()`: 打开通知面板。
- `NotificationSystem.closePanel()`: 关闭通知面板。

## 浏览器权限

- `NotificationSystem.requestPermission()`: 请求浏览器通知权限。
- `NotificationSystem.getPermissionStatus()`: 获取浏览器通知权限状态。
