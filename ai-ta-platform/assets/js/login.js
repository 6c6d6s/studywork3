/**
 * 登录页交互脚本
 * 覆盖：个性化问候、角色切换、密码可见性、Caps Lock 提醒、
 *       约束校验 API 自定义提示、记住账号、模拟登录反馈。
 */
(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var account = document.getElementById('account');
  var accountLabel = document.getElementById('accountLabel');
  var accountHint = document.getElementById('accountHint');
  var password = document.getElementById('password');
  var togglePassword = document.getElementById('togglePassword');
  var capsHint = document.getElementById('capsHint');
  var remember = document.getElementById('remember');
  var message = document.getElementById('formMessage');
  var submitBtn = document.getElementById('submitBtn');
  var greeting = document.getElementById('greeting');
  var roles = document.querySelectorAll('input[name="role"]');

  var REMEMBER_KEY = 'ai-ta-platform-account';

  /** 不同身份的字段规则与文案，切换角色时同步更新 */
  var ROLE_PROFILE = {
    student: {
      label: '学号',
      placeholder: '请输入 8 位学号',
      pattern: '^[0-9]{8}$',
      minlength: '8',
      maxlength: '8',
      inputmode: 'numeric',
      hint: '学生账号为教务系统学号'
    },
    teacher: {
      label: '工号',
      placeholder: '请输入 6 位教工号',
      pattern: '^[0-9]{6}$',
      minlength: '6',
      maxlength: '6',
      inputmode: 'numeric',
      hint: '教师账号为学校教工号，可在人事系统查询'
    },
    assistant: {
      label: '助教邮箱',
      placeholder: '请输入邮箱前缀',
      pattern: '^[A-Za-z][A-Za-z0-9._-]{2,19}$',
      minlength: '3',
      maxlength: '20',
      inputmode: 'text',
      hint: '助教使用校内邮箱前缀登录，例如 zhangsan'
    }
  };

  /** 按访问时间生成个性化问候语 */
  function renderGreeting() {
    var hour = new Date().getHours();
    var period = hour < 6 ? '深夜' : hour < 11 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';
    var tip = hour < 6 ? '记得早点休息，答疑记录会为你保留' : '今天的答疑记录已同步到你的学习档案';
    greeting.textContent = period + '好，欢迎回到 AI 助教答疑平台。' + tip;
  }

  /** 角色切换：更新字段规则、提示语与主题强调色 */
  function switchRole(role) {
    var profile = ROLE_PROFILE[role] || ROLE_PROFILE.student;
    accountLabel.textContent = profile.label;
    account.placeholder = profile.placeholder;
    account.setAttribute('pattern', profile.pattern);
    account.setAttribute('minlength', profile.minlength);
    account.setAttribute('maxlength', profile.maxlength);
    account.setAttribute('inputmode', profile.inputmode);
    accountHint.textContent = profile.hint;
    account.value = '';
    account.setCustomValidity('');
    clearMessage();
  }

  /** 统一的消息输出：type 为 error / ok / info */
  function showMessage(text, type) {
    message.textContent = text;
    message.dataset.state = type || 'error';
  }

  function clearMessage() {
    message.textContent = '';
    delete message.dataset.state;
  }

  /** 把浏览器默认的校验结果翻译成中文提示 */
  function describeValidity(field) {
    var v = field.validity;
    if (v.valueMissing) return '请填写' + (field === account ? accountLabel.textContent : '密码');
    if (v.patternMismatch || v.tooShort) {
      return accountLabel.textContent + '格式不正确，' + accountHint.textContent;
    }
    if (v.tooLong) return '输入内容过长，请检查后重试';
    return field.validationMessage;
  }

  roles.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        switchRole(radio.value);
      }
    });
  });

  // 密码可见性切换
  togglePassword.addEventListener('click', function () {
    var visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    togglePassword.textContent = visible ? '显示' : '隐藏';
    togglePassword.setAttribute('aria-pressed', String(!visible));
    password.focus();
  });

  // Caps Lock 状态提醒
  function updateCaps(event) {
    var on = event.getModifierState && event.getModifierState('CapsLock');
    capsHint.hidden = !on;
  }
  password.addEventListener('keydown', updateCaps);
  password.addEventListener('keyup', updateCaps);
  password.addEventListener('blur', function () {
    capsHint.hidden = true;
  });

  // 实时校验：输入过程中就给出提示，避免提交后才发现问题
  [account, password].forEach(function (field) {
    field.addEventListener('input', function () {
      field.setCustomValidity('');
      if (field.value.length === 0 || field.checkValidity()) {
        clearMessage();
      } else {
        showMessage(describeValidity(field), 'error');
      }
    });
  });

  // 提交：先做约束校验，再做一次模拟的身份验证请求
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      var firstInvalid = form.querySelector(':invalid');
      showMessage(describeValidity(firstInvalid), 'error');
      firstInvalid.focus();
      firstInvalid.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '正在验证身份…';
    clearMessage();

    // 演示环境用定时器模拟异步请求，实际项目替换为 fetch 调用后端接口
    window.setTimeout(function () {
      var role = document.querySelector('input[name="role"]:checked').value;
      saveAccount();
      submitBtn.disabled = false;
      submitBtn.textContent = '登录';
      showMessage('身份验证通过，正在进入「' + roleName(role) + '」工作台…', 'ok');
    }, 700);
  });

  function roleName(role) {
    return { student: '学生', teacher: '教师', assistant: '助教' }[role] || '学生';
  }

  /** 勾选“记住我的账号”时把账号写入 localStorage */
  function saveAccount() {
    try {
      if (remember.checked) {
        localStorage.setItem(REMEMBER_KEY, account.value);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (error) {
      /* 忽略存储失败 */
    }
  }

  /** 回填上次登录的账号，实现“个性化”的二次访问体验 */
  function restoreAccount() {
    var saved = null;
    try {
      saved = localStorage.getItem(REMEMBER_KEY);
    } catch (error) {
      saved = null;
    }
    if (saved) {
      account.value = saved;
      password.focus();
    }
  }

  form.addEventListener('reset', function () {
    clearMessage();
    account.setCustomValidity('');
  });

  document.querySelectorAll('[data-oauth]').forEach(function (button) {
    button.addEventListener('click', function () {
      showMessage('正在跳转到' + button.dataset.oauth + '…', 'info');
    });
  });

  document.getElementById('forgotLink').addEventListener('click', function (event) {
    event.preventDefault();
    showMessage('已向你的校园邮箱发送找回密码指引，请在 30 分钟内完成重置。', 'ok');
  });

  renderGreeting();
  restoreAccount();
})();
