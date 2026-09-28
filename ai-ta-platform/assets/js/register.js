/**
 * 注册页交互脚本
 * 覆盖：实时资料完整度、用户名可用性校验、密码强度（meter + output）、
 *       两次密码一致性、身份联动、图片预览、草稿自动保存与恢复、提交汇总。
 */
(function () {
  'use strict';

  var form = document.getElementById('registerForm');
  var DRAFT_KEY = 'ai-ta-platform-register-draft';
  var AUTOSAVE_DELAY = 600;

  var username = document.getElementById('username');
  var usernameBadge = document.getElementById('usernameBadge');
  var email = document.getElementById('email');
  var phone = document.getElementById('phone');
  var password = document.getElementById('password');
  var password2 = document.getElementById('password2');
  var pwMeter = document.getElementById('pwMeter');
  var pwText = document.getElementById('pwText');
  var togglePassword = document.getElementById('togglePassword');
  var college = document.getElementById('college');
  var serial = document.getElementById('serial');
  var serialLabel = document.getElementById('serialLabel');
  var weekly = document.getElementById('weekly');
  var weeklyText = document.getElementById('weeklyText');
  var themeColor = document.getElementById('themeColor');
  var colorText = document.getElementById('colorText');
  var avatar = document.getElementById('avatar');
  var avatarPreview = document.getElementById('avatarPreview');
  var agree = document.getElementById('agree');
  var message = document.getElementById('formMessage');
  var summary = document.getElementById('summary');
  var autosaveTip = document.getElementById('autosaveTip');
  var registerBtn = document.getElementById('registerBtn');
  var progress = document.getElementById('fillProgress');
  var progressText = document.getElementById('fillProgressText');
  var roles = document.querySelectorAll('#registerForm input[name="role"]');

  /** 必填字段清单：用于计算资料完整度 */
  var requiredFields = [username, email, phone, password, password2, serial, college, agree];

  var ROLE_SERIAL = {
    '学生': { label: '学号', placeholder: '8 位数字', pattern: '^[0-9]{8}$', length: 8 },
    '教师': { label: '工号', placeholder: '6 位教工号', pattern: '^[0-9]{6}$', length: 6 },
    '助教': { label: '助教编号', placeholder: '以 TA 开头的 6 位编号', pattern: '^TA[0-9]{4}$', length: 6 }
  };

  function setMessage(text, state) {
    message.textContent = text || '';
    message.dataset.state = state || 'error';
  }

  /* ---------------- 1. 资料完整度 ---------------- */

  function refreshProgress() {
    var filled = requiredFields.filter(function (field) {
      if (field.type === 'checkbox') return field.checked;
      return field.value.trim() !== '' && field.checkValidity();
    }).length;
    var percent = Math.round((filled / requiredFields.length) * 100);
    progress.value = percent;
    progress.textContent = percent + '%';
    progressText.textContent = percent + '%';
  }

  /* ---------------- 2. 用户名可用性 ---------------- */

  var usernameTimer = null;
  var TAKEN_NAMES = ['admin', 'teacher', 'root', 'test'];

  function checkUsername() {
    if (username.value.trim() === '') {
      usernameBadge.textContent = '';
      usernameBadge.removeAttribute('data-state');
      return;
    }
    if (!username.checkValidity()) {
      usernameBadge.textContent = '格式不符';
      usernameBadge.dataset.state = 'bad';
      return;
    }
    usernameBadge.textContent = '校验中…';
    usernameBadge.dataset.state = 'loading';

    // 演示环境用定时器模拟接口请求；真实项目改为 fetch('/api/username/check')
    window.clearTimeout(usernameTimer);
    usernameTimer = window.setTimeout(function () {
      var taken = TAKEN_NAMES.indexOf(username.value.toLowerCase()) !== -1;
      if (taken) {
        username.setCustomValidity('该用户名已被占用，请更换');
        usernameBadge.textContent = '已被占用';
        usernameBadge.dataset.state = 'bad';
      } else {
        username.setCustomValidity('');
        usernameBadge.textContent = '可以使用';
        usernameBadge.dataset.state = 'ok';
      }
      refreshProgress();
    }, 400);
  }

  /* ---------------- 3. 密码强度与一致性 ---------------- */

  function scorePassword(value) {
    if (!value) return 0;
    var score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return Math.min(score, 4);
  }

  var STRENGTH_TEXT = ['尚未输入', '偏弱：建议加长到 8 位以上', '一般：可以再混合大小写', '良好：已经比较安全', '很强：符合推荐强度'];

  function refreshStrength() {
    var score = scorePassword(password.value);
    pwMeter.value = score;
    pwText.textContent = STRENGTH_TEXT[score];
  }

  function checkPasswordMatch() {
    if (password2.value === '') {
      password2.setCustomValidity('');
      return;
    }
    var matched = password.value === password2.value;
    password2.setCustomValidity(matched ? '' : '两次输入的密码不一致');
  }

  /* ---------------- 4. 身份联动 ---------------- */

  function applyRole(role) {
    var profile = ROLE_SERIAL[role] || ROLE_SERIAL['学生'];
    serialLabel.textContent = profile.label;
    serial.placeholder = profile.placeholder;
    serial.setAttribute('pattern', profile.pattern);
    serial.setAttribute('maxlength', String(profile.length));
    serial.value = '';
    serial.setCustomValidity('');
  }

  /* ---------------- 5. 图片预览 ---------------- */

  avatar.addEventListener('change', function () {
    var file = avatar.files && avatar.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      avatar.setCustomValidity('请选择 PNG、JPG 或 WebP 图片');
      setMessage('头像格式不支持，请重新选择图片文件。', 'error');
      return;
    }
    avatar.setCustomValidity('');
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      avatarPreview.src = reader.result;
    });
    reader.readAsDataURL(file); // FileReader + DataURL 实现免上传的本地预览
  });

  /* ---------------- 6. 草稿自动保存 ---------------- */

  function collectDraft() {
    return {
      username: username.value,
      email: email.value,
      phone: phone.value,
      school: document.getElementById('school').value,
      password: password.value,
      password2: password2.value,
      role: document.querySelector('#registerForm input[name="role"]:checked').value,
      serial: serial.value,
      college: college.value,
      grade: document.getElementById('grade').value,
      interests: Array.prototype.map.call(
        document.querySelectorAll('#registerForm input[name="interest"]:checked'),
        function (input) { return input.value; }
      ),
      course: document.getElementById('course').value,
      askTime: document.getElementById('askTime').value,
      weekly: weekly.value,
      themeColor: themeColor.value,
      invite: document.getElementById('invite').value,
      homepage: document.getElementById('homepage').value,
      agree: agree.checked
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
      autosaveTip.textContent = '草稿已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
    } catch (error) {
      autosaveTip.textContent = '当前浏览器不支持草稿保存';
    }
  }

  var autosaveTimer = null;
  form.addEventListener('input', function () {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(saveDraft, AUTOSAVE_DELAY);
  });

  function restoreDraft() {
    var raw = null;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
    } catch (error) {
      raw = null;
    }
    if (!raw) return;

    var draft;
    try {
      draft = JSON.parse(raw);
    } catch (error) {
      return;
    }

    Object.keys(draft).forEach(function (key) {
      var value = draft[key];
      if (key === 'interests') {
        document.querySelectorAll('#registerForm input[name="interest"]').forEach(function (input) {
          input.checked = value.indexOf(input.value) !== -1;
        });
        return;
      }
      if (key === 'role') {
        document.querySelectorAll('#registerForm input[name="role"]').forEach(function (input) {
          if (input.value === value) input.checked = true;
        });
        applyRole(value);
        return;
      }
      if (key === 'agree') {
        agree.checked = Boolean(value);
        return;
      }
      var field = document.getElementById(key);
      if (field) field.value = value;
    });

    autosaveTip.textContent = '已恢复上次未提交的草稿';
  }

  /* ---------------- 7. 提交与汇总 ---------------- */

  function buildSummary(formData) {
    var interests = formData.getAll('interest');
    var rows = [
      ['用户名', formData.get('username')],
      ['邮箱', formData.get('email')],
      ['手机号', formData.get('phone')],
      ['平台身份', formData.get('role')],
      [ROLE_SERIAL[formData.get('role')].label, formData.get('serial')],
      ['所属学院', formData.get('college')],
      ['学科兴趣', interests.length ? interests.join('、') : '暂未选择'],
      ['常用提问时段', formData.get('askTime')],
      ['每周答疑目标', formData.get('weekly') + ' 次'],
      ['主题色', formData.get('themeColor')],
      ['头像', avatar.files && avatar.files[0] ? avatar.files[0].name : '使用默认头像']
    ];
    var html = '<h3>注册信息确认</h3><dl>';
    rows.forEach(function (row) {
      html += '<dt>' + row[0] + '</dt><dd>' + (row[1] || '未填写') + '</dd>';
    });
    html += '</dl>';
    return html;
  }

  /** 取得字段对应的中文名称：优先使用 <label for>，其次使用外层 label */
  function labelOf(field) {
    var label = null;
    if (field.labels && field.labels.length) {
      label = field.labels[0];
    } else if (field.closest('label')) {
      label = field.closest('label');
    } else if (field.id) {
      label = form.querySelector('label[for="' + field.id + '"]');
    }
    if (!label) return field.name || '该字段';
    return label.textContent.replace(/\s*\*$/, '').trim();
  }

  /** 把浏览器的校验失败原因翻译成便于阅读的中文提示 */
  function describeValidity(field) {
    var v = field.validity;
    if (v.valueMissing) return '此项为必填，请补充后再提交';
    if (v.patternMismatch) return '格式不符合要求，请参考输入框中的说明';
    if (v.tooShort) return '长度不足，至少需要 ' + field.minLength + ' 个字符';
    if (v.tooLong) return '长度超出限制，最多 ' + field.maxLength + ' 个字符';
    if (v.typeMismatch) return '内容格式有误，例如邮箱需要形如 name@example.com';
    if (v.rangeUnderflow) return '数值小于允许的最小值 ' + field.min;
    if (v.rangeOverflow) return '数值大于允许的最大值 ' + field.max;
    if (v.stepMismatch) return '数值不符合规定的步长';
    return field.validationMessage || '填写内容未通过校验';
  }

  /** 找到第一个校验不通过的控件 */
  function firstInvalidField() {
    return Array.prototype.find.call(form.elements, function (element) {
      return element.willValidate && !element.checkValidity();
    });
  }

  function validateForm() {
    checkPasswordMatch();
    var invalid = firstInvalidField();
    if (!invalid) return true;

    setMessage('请检查「' + labelOf(invalid) + '」：' + describeValidity(invalid), 'error');
    invalid.focus();
    invalid.reportValidity();
    return false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    summary.hidden = true;

    if (!validateForm()) return;

    registerBtn.disabled = true;
    registerBtn.textContent = '正在创建账号…';

    window.setTimeout(function () {
      registerBtn.disabled = false;
      registerBtn.textContent = '注册并进入平台';
      setMessage('注册成功，欢迎加入 AI 助教答疑平台。', 'ok');
      summary.innerHTML = buildSummary(new FormData(form));
      summary.hidden = false;
      summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        /* 忽略 */
      }
      autosaveTip.textContent = '草稿已在注册成功后清除';
    }, 800);
  });

  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      summary.hidden = true;
      setMessage('');
      autosaveTip.textContent = '';
      refreshProgress();
      refreshStrength();
      applyRole('学生');
      avatarPreview.src = 'assets/img/avatar-placeholder.svg';
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        /* 忽略 */
      }
    }, 0);
  });

  /* ---------------- 8. 事件绑定 ---------------- */

  username.addEventListener('input', function () {
    username.setCustomValidity('');
    checkUsername();
    refreshProgress();
  });

  password.addEventListener('input', function () {
    refreshStrength();
    checkPasswordMatch();
    refreshProgress();
  });

  password2.addEventListener('input', function () {
    checkPasswordMatch();
    if (password2.validationMessage) {
      setMessage(password2.validationMessage, 'error');
    } else {
      setMessage('');
    }
    refreshProgress();
  });

  togglePassword.addEventListener('click', function () {
    var visible = password.type === 'text';
    [password, password2].forEach(function (field) {
      field.type = visible ? 'password' : 'text';
    });
    togglePassword.textContent = visible ? '显示' : '隐藏';
    togglePassword.setAttribute('aria-pressed', String(!visible));
  });

  roles.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        applyRole(radio.value);
        refreshProgress();
      }
    });
  });

  weekly.addEventListener('input', function () {
    weeklyText.textContent = weekly.value + ' 次';
  });

  themeColor.addEventListener('input', function () {
    colorText.textContent = themeColor.value;
    // 让个性化主题色即时作用在页面强调色上
    document.documentElement.style.setProperty('--brand', themeColor.value);
  });

  requiredFields.forEach(function (field) {
    field.addEventListener('change', refreshProgress);
    field.addEventListener('input', refreshProgress);
  });

  ['email', 'phone', 'serial', 'college'].forEach(function (id) {
    var field = document.getElementById(id);
    field.addEventListener('blur', function () {
      if (field.value && !field.checkValidity()) {
        setMessage('「' + (field.labels && field.labels[0] ? field.labels[0].textContent.trim() : '字段') + '」格式不符合要求，请检查。', 'error');
      }
    });
  });

  // 页面初始化
  restoreDraft();
  refreshStrength();
  refreshProgress();
})();
