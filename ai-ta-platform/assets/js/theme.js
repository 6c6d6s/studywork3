/**
 * 主题切换脚本（登录页与注册页共用）
 * 使用 localStorage 记住用户选择，并优先读取系统的 prefers-color-scheme。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ai-ta-platform-theme';
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  /** 读取初始主题：URL 参数 > 本地记录 > 系统偏好 > 浅色 */
  function resolveTheme() {
    // 支持通过 ?theme=dark 分享指定主题的链接，例如分享深色模式截图
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get('theme');
    } catch (error) {
      fromUrl = null;
    }
    if (fromUrl === 'light' || fromUrl === 'dark') {
      return fromUrl;
    }
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      saved = null; // 隐私模式下 localStorage 可能不可用
    }
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /** 应用主题，并同步按钮文案与 aria 状态 */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '☀️ 浅色' : '🌙 深色';
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }

  applyTheme(resolveTheme());

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (error) {
        /* 忽略存储失败，主题在当前会话内依然生效 */
      }
    });
  }
})();
