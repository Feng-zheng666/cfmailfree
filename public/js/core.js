/**
 * 统一Toast工具模块 - 高内聚低耦合设计
 * 
 * 功能特性:
 * - 统一使用 /templates/toast.html 模板
 * - 左上角显示 (top: 24px, left: 24px)
 * - 图标映射自动处理
 * - 统一动画效果
 * - 自动容器管理
 */

// Toast模板缓存
let __toastTpl = null;
let __toastTplPromise = null;

// 图标映射配置 - 使用最基本的字符确保兼容性
const ICON_MAP = {
  'success': '✓',
  'warn': '!', 
  'error': '×',
  'info': 'i'
};

// Toast容器配置
const CONTAINER_STYLES = {
  position: 'fixed',
  top: '24px',
  left: '24px',
  right: 'auto',
  bottom: 'auto',
  zIndex: '2000',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxWidth: '420px',
  pointerEvents: 'none',
  opacity: '1'
};

/**
 * 预加载Toast模板
 */
function preloadToastTemplate() {
  try {
    __toastTplPromise = fetch('/templates/toast.html', { cache: 'force-cache' })
      .then(r => r && r.ok ? r.text() : null)
      .then(t => { __toastTpl = t; return t; })
      .catch(() => null);
  } catch (_) { }
}

/**
 * 确保Toast容器存在并应用正确样式
 */
function ensureToastContainer() {
  let container = document.getElementById('toast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast';
    container.className = 'toast';
    document.body.appendChild(container);
  }

  // 重置可能与CSS类冲突的样式属性
  container.style.cssText = '';

  // 应用容器样式 - 确保左上角显示
  Object.assign(container.style, CONTAINER_STYLES);

  return container;
}

/**
 * 统一Toast显示函数
 * @param {string} message - 提示消息
 * @param {string} type - 类型 (success|warn|error|info)
 * @param {number} duration - 显示时长(ms), 默认3000
 */
async function showToast(message, type = 'info', duration = 3000) {
  try {
    // 获取模板
    if (!__toastTpl) {
      if (!__toastTplPromise) {
        try { 
          __toastTplPromise = fetch('/templates/toast.html', { cache: 'force-cache' })
            .then(r => r && r.ok ? r.text() : null)
            .then(t => { __toastTpl = t; return t; }); 
        } catch (_) { }
      }
      try { __toastTpl = await __toastTplPromise; } catch (_) { }
    }
    
    // 获取图标
    const icon = ICON_MAP[type] || ICON_MAP.info;
    
    // 渲染模板
    const tpl = __toastTpl || '';
    const html = tpl
      .replace('{{type}}', String(type || 'info'))
      .replace('{{icon}}', icon)
      .replace('{{message}}', String(message || ''));
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    
    // 注入样式（仅一次）
    const styleEl = wrapper.querySelector('#toast-style');
    if (styleEl && !document.getElementById('toast-style')) {
      document.head.appendChild(styleEl);
    }
    
    // 插入toast元素
    const toastEl = wrapper.querySelector('.toast-item');
    if (toastEl) {
      const container = ensureToastContainer();
      container.appendChild(toastEl);
      
      // 统一消失动画
      setTimeout(() => {
        toastEl.style.animation = 'slideOutLeft 0.3s cubic-bezier(0.4, 0, 1, 1) forwards';
        setTimeout(() => toastEl.remove(), 300);
      }, duration);
      return;
    }
    
    // 模板失败时的降级处理
    throw new Error('toast template missing');
    
  } catch (_) {
    // 降级到简易toast
    const div = document.createElement('div');
    div.className = `toast-item ${type}`;
    div.innerHTML = `<span class="toast-icon">${ICON_MAP[type] || ICON_MAP.info}</span><span class="toast-message">${message}</span>`;
    
    const container = ensureToastContainer();
    container.appendChild(div);
    
    setTimeout(() => {
      div.style.transition = 'opacity .3s ease';
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 300);
    }, duration);
  }
}

/**
 * 便捷方法
 */
const Toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  warn: (message, duration) => showToast(message, 'warn', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  show: showToast
};

// 预加载模板
preloadToastTemplate();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showToast, Toast };
} else {
  window.showToast = showToast;
  window.Toast = Toast;
}
(function(global){
  function formatTs(ms){
    return new Date(ms).toISOString().replace('T',' ').slice(0,19);
  }

  function mockGenerateId(len){
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const L = Math.max(8, Math.min(30, Number(len)||8));
    let s = '';
    for (let i=0;i<L;i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
  }

  function buildMockEmails(count){
    const now = Date.now();
    const templates = [
      (code)=>`您的验证码为 ${code}，5 分钟内有效`,
      (code)=>`Your verification code is ${code}. It expires in 5 minutes`,
      (code)=>`One-time code: ${code}`,
      (code)=>`安全验证 · 验证码 ${code}`,
      (code)=>`Login code is ${code}`,
    ];
    return Array.from({length: count||6}).map((_, i) => {
      const id = 10000 + i;
      const code = String((Math.abs((id*7919)%900000)+100000)).slice(0,6);
      return {
        id,
        sender: `demo${i}@example.com`,
        subject: templates[i%templates.length](code),
        received_at: formatTs(now - i*600000),
        is_read: i>1,
        content: `您好，您正在体验演示模式。验证码: ${code} ，请在 5 分钟内完成验证。`,
        html_content: `<p>您好，您正在体验 <strong>演示模式</strong>。</p><p><strong>验证码: ${code}</strong></p>`
      };
    });
  }

  function buildMockMailboxes(limit, offset, domains){
    const now = Date.now();
    const list = [];
    const size = Math.min(limit||10, 10);
    const arrDomains = Array.isArray(domains) && domains.length ? domains : ['example.com'];
    for (let i=0;i<size;i++){
      list.push({
        address: `${mockGenerateId(10)}@${arrDomains[(offset||0 + i)%arrDomains.length]}`,
        created_at: formatTs(now - (offset||0 + i)*3600000),
      });
    }
    return list;
  }

  function buildMockEmailDetail(id){
    const code = String((Math.abs((Number(id||10000)*7919)%900000)+100000)).slice(0,6);
    return {
      id: Number(id)||10000,
      sender: 'noreply@example.com',
      subject: `演示邮件内容（验证码 ${code}）`,
      received_at: formatTs(Date.now()),
      content: `这是演示模式下的邮件内容，仅用于展示界面效果。验证码：${code}`,
      html_content: `<p><strong>演示模式</strong>：该内容为模拟数据。</p><p>验证码：<strong>${code}</strong></p>`
    };
  }

  global.MockData = { formatTs, mockGenerateId, buildMockEmails, buildMockMailboxes, buildMockEmailDetail };
})(typeof window !== 'undefined' ? window : this);


// 入口最早阶段尝试保存当前 hash，避免在任何重定向前丢失
try{
  if (location.hash) {
    sessionStorage.setItem('mf:preservedHash', location.hash);
  }
}catch(_){ }

(function(){
  function isDirectAddressBarVisit(){
    try{
      // 无引用来源或历史很短，视作地址栏直达/刷新
      if (!document.referrer) return true;
      if (window.history && window.history.length <= 1) return true;
    }catch(_){ }
    return false;
  }
  // 预取首页关键数据并写入 sessionStorage，供首屏直接复用
  async function prefetchHomeData(){
    try{
      const save = (key, data) => {
        try{ sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); }catch(_){ }
      };
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), 8000);
      const opts = { method: 'GET', headers: { 'Cache-Control': 'no-cache' }, keepalive: true, signal: controller.signal };
      const mailboxes = fetch('/api/mailboxes?limit=10&offset=0', opts).then(r => r.ok ? r.json() : { list: [] }).then(data => save('mf:prefetch:mailboxes', Array.isArray(data) ? data : (data.list || []) )).catch(()=>{});
      const quota = fetch('/api/user/quota', opts).then(r => r.ok ? r.json() : null).then(data => { if (data) save('mf:prefetch:quota', data); }).catch(()=>{});
      const domains = fetch('/api/domains', opts).then(r => r.ok ? r.json() : []).then(list => { if (Array.isArray(list) && list.length) save('mf:prefetch:domains', list); }).catch(()=>{});
      // 不阻塞太久：最多等待 800ms 即跳转，其余继续后台完成（keepalive）
      await Promise.race([
        Promise.all([mailboxes, quota, domains]),
        new Promise(res => setTimeout(res, 800))
      ]);
      clearTimeout(timeout);
    }catch(_){ }
  }
  function getRedirectTarget(){
    try{ 
      const u = new URL(location.href); 
      let redirectParam = u.searchParams.get('redirect') || '/';
      // 优先从 sessionStorage 读取在来源页保存的 hash
      let preservedHash = '';
      try{ preservedHash = sessionStorage.getItem('mf:preservedHash') || ''; }catch(_){ }
      // 当前页若也带有 hash 作为兜底
      const currentHash = location.hash || '';
      const hashToUse = preservedHash || currentHash;
      if ((redirectParam === '/' || redirectParam === '/html/app.html') && hashToUse) {
        return redirectParam + hashToUse;
      }
      return redirectParam;
    }catch(_){ 
      // 发生错误时，优先使用已保存的 hash
      try{ const ph = sessionStorage.getItem('mf:preservedHash'); if (ph) return '/' + ph; }catch(_){ }
      return location.hash ? '/' + location.hash : '/'; 
    }
  }
  function hasRedirectParam(){
    try{ const u = new URL(location.href); return !!u.searchParams.get('redirect'); }catch(_){ return false; }
  }
  function pollAuth(maxWaitMs = 2000, intervalMs = 200){
    const target = getRedirectTarget();
    const shouldWait = hasRedirectParam();
    const start = Date.now();
    let isForced = false;
    try{ const u = new URL(location.href); isForced = (u.searchParams.get('force') === '1'); }catch(_){ }
    (async function attempt(){
      try{
        // 延长超时时间，减少误判
        const controller = new AbortController();
        const tid = setTimeout(()=>{ try{ controller.abort(); }catch(_){ } }, 1500); // 从400ms增加到1500ms
        const response = await fetch('/api/session', { method: 'GET', headers: { 'Cache-Control': 'no-cache' }, signal: controller.signal });
        clearTimeout(tid);
        if (response.ok){
          try{ sessionStorage.setItem('auth_checked', 'true'); sessionStorage.setItem('auth_checked_ts', String(Date.now())); }catch(_){ }
          // 登录确认后立刻预取首页数据
          try{ await prefetchHomeData(); }catch(_){ }
          return void window.location.replace(target);
        }
        // 未通过：若目标为 /admin.html 则保持在 loading 等待，不跳登录，避免泄露 admin
        if (target === '/html/admin.html'){
          if (isForced || (Date.now() - start) < maxWaitMs){ setTimeout(attempt, intervalMs); return; }
          return void window.location.replace('/html/login.html');
        }
      }catch(_){ }
      // 强制模式：持续等待，但减少等待时间
      if (isForced && (Date.now() - start) < 6000){ setTimeout(attempt, intervalMs); return; }
      if (shouldWait && (Date.now() - start) < maxWaitMs){ setTimeout(attempt, intervalMs); return; }
      // 在跳转到登录页前，先检查cookie并清理
      try{
        var hasCookie = document.cookie.split(';').some(function(c){ return c.trim().indexOf('iding-session=') === 0; });
        if (hasCookie) {
          // 如果有cookie但验证失败，说明cookie可能已过期，清除它
          document.cookie = 'iding-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      }catch(_){}
      // 默认回登录页
      window.location.replace('/html/login.html');
    })();
  }

  // 检查并处理已登录用户访问登录页的情况
  function checkLoginPageAccess(){
    try{
      if (location.pathname === '/login' || location.pathname === '/html/login.html'){
        var hasToken = document.cookie.split(';').some(function(c){ return c.trim().indexOf('iding-session=') === 0; });
        if (hasToken){
          // 如果是从其他页面跳转过来的（有referrer），先验证cookie是否真的有效
          // 避免无效cookie导致的循环跳转
          if (document.referrer) {
            // 异步验证cookie有效性
            (async function(){
              try{
                const controller = new AbortController();
                const tid = setTimeout(()=>{ try{ controller.abort(); }catch(_){ } }, 1500);
                const r = await fetch('/api/session', { 
                  method: 'GET', 
                  headers: { 'Cache-Control': 'no-cache' }, 
                  signal: controller.signal,
                  credentials: 'include'
                });
                clearTimeout(tid);
                if (r && r.ok) {
                  // cookie有效，跳转
                  var target = '/';
                  try{
                    var ph = sessionStorage.getItem('mf:preservedHash') || '';
                    if (!ph && location.hash) ph = location.hash;
                    if (ph) target += ph;
                  }catch(_){ }
                  location.replace(target);
                } else {
                  // cookie无效，清除它
                  document.cookie = 'iding-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                }
              }catch(_){
                // 验证失败，保持在登录页
              }
            })();
            return true;
          } else {
            // 直接访问登录页且有cookie，立即跳转
            var target = '/';
            try{
              var ph = sessionStorage.getItem('mf:preservedHash') || '';
              if (!ph && location.hash) ph = location.hash;
              if (ph) target += ph;
            }catch(_){ }
            location.replace(target);
            return true;
          }
        }
      }
    }catch(_){ }
    return false;
  }
  
  // 立即执行检查，无论文档状态如何
  checkLoginPageAccess();

  window.AuthGuard = {
    pollAuth,
    checkLoginPageAccess,
    goLoading: function(target, statusText, options){
      try{
        const force = options && options.force ? true : false;
        // 仅地址栏直达时进入 loading 检查；否则直接按目标/登录处理
        if (isDirectAddressBarVisit() || force){
          const params = new URLSearchParams();
          if (target) params.set('redirect', target);
          if (statusText) params.set('status', statusText);
          if (force) params.set('force', '1');
          const q = params.toString();
          location.replace('/templates/loading.html' + (q ? ('?' + q) : ''));
        }else{
          // 非直达：避免进入 loading 轮询，改为快速会话校验
          const quickCheck = async () => {
            try{
              const controller = new AbortController();
              const tid = setTimeout(()=>{ try{ controller.abort(); }catch(_){ } }, 1500); // 从500ms延长到1500ms
              const r = await fetch('/api/session', { method:'GET', headers:{ 'Cache-Control':'no-cache' }, signal: controller.signal, credentials: 'include' });
              clearTimeout(tid);
              if (r && r.ok){
                try{ sessionStorage.setItem('auth_checked','true'); }catch(_){ }
                if (target){
                  // 已在目标页则不再跳转，避免循环
                  try{ const u = new URL(target, location.origin); if (u.pathname === location.pathname) return; }catch(_){ }
                  location.replace(target);
                }
                return;
              }
            }catch(_){ }
            location.replace('/html/login.html');
          };
          quickCheck();
        }
      }catch(_){ location.replace('/html/login.html'); }
    }
  };

  // autorun for loading page
  if (document.currentScript && document.currentScript.dataset.autorun === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      // 若带有 force=1，则强制在 loading 页面执行更长时间的轮询
      let forced = false;
      try{ const u = new URL(location.href); forced = (u.searchParams.get('force') === '1'); }catch(_){ }
      // 只有地址栏直达或强制模式下才执行轮询检查
      if (forced || isDirectAddressBarVisit()){
        pollAuth(forced ? 5000 : 1500, 150);
      }else{
        // 非直达则尽快返回目标或首页
        try{
          const u = new URL(location.href);
          const target = u.searchParams.get('redirect') || '/';
          window.location.replace(target);
        }catch(_){ window.location.replace('/'); }
      }
    });
  }
})();


// ========== 路由管理系统 ==========
// 为电脑端添加完整的 hash 路由支持，与手机端保持一致

// 立即保存当前hash到sessionStorage，防止权限验证过程中丢失
try {
  if (location.hash) {
    sessionStorage.setItem('mf:preservedHash', location.hash);
  }
} catch(_) {}

(function() {
  const RouteManager = {
    currentView: null,
    initialized: false,
    originalHash: null,
    isHandlingPopstate: false,
    
    // 初始化路由
    init() {
      if (this.initialized) return;
      this.initialized = true;
      
      // 立即保存原始hash，防止权限验证过程中丢失
      this.originalHash = location.hash || '';
      
      // 尝试从sessionStorage恢复保存的hash
      try {
        const preservedHash = sessionStorage.getItem('mf:preservedHash');
        if (preservedHash && !this.originalHash) {
          this.originalHash = preservedHash;
          sessionStorage.removeItem('mf:preservedHash'); // 使用后清除
        }
      } catch(_) {}
      
      // 监听 hash 变化和浏览器历史导航
      window.addEventListener('hashchange', () => {
        // console.log('hashchange事件触发，当前hash:', location.hash);
        this.handleRoute();
      });
      
      window.addEventListener('popstate', (event) => {
        // console.log('popstate事件触发，当前hash:', location.hash, '事件状态:', event.state);
        // popstate 事件专门处理浏览器的前进/后退按钮
        this.isHandlingPopstate = true;
        this.handleRoute();
        // 重置标记，避免影响后续的主动导航
        setTimeout(() => {
          this.isHandlingPopstate = false;
        }, 100);
      });
      
      // 延迟初始化路由处理，等待权限验证完成
      setTimeout(() => {
        // 检查是否已经通过权限验证
        const authChecked = sessionStorage.getItem('auth_checked');
        if (authChecked) {
          this.restoreAndHandleRoute();
        } else {
          // 如果还没验证，继续等待
          this.waitForAuth();
        }
      }, 500);
      
      // 绑定导航事件
      this.bindNavigationEvents();
    },
    
    // 等待权限验证完成
    waitForAuth() {
      let attempts = 0;
      const checkAuth = () => {
        const authChecked = sessionStorage.getItem('auth_checked');
        if (authChecked) {
          this.restoreAndHandleRoute();
        } else {
          attempts++;
          if (attempts < 20) { // 最多等待10秒
            setTimeout(checkAuth, 500);
          }
        }
      };
      setTimeout(checkAuth, 500);
    },
    
    // 恢复原始hash并处理路由
    restoreAndHandleRoute() {
      // 如果有保存的原始hash，先恢复它
      if (this.originalHash && this.originalHash !== location.hash) {
        try {
          // 静默恢复hash，不触发hashchange事件
          history.replaceState(null, '', this.originalHash || '#');
        } catch(_) {}
      }
      // 然后处理路由
      this.handleRoute();
    },
    
    // 处理路由变化
    handleRoute() {
      const currentHash = location.hash.slice(1);
      // 智能默认路由：只有在用户本来就没有hash时才使用默认路由
      const hash = currentHash || (this.originalHash ? this.originalHash.slice(1) : 'inbox');
      
      // 避免重复处理相同路由
      if (this.currentView === hash) return;
      
      this.currentView = hash;
      
      switch(hash) {
        case 'inbox':
          this.showInbox();
          break;
        case 'sent':
          this.showSent();
          break;
        case 'generate':
          this.showGenerate();
          break;
        case 'history':
          this.showHistory();
          break;
        case 'mail':
          // 兼容旧的 #mail 路由，根据当前状态决定显示收件箱还是发件箱
          if (window.isSentView) {
            this.showSent();
          } else {
            this.showInbox();
          }
          break;
        default:
          // 默认显示收件箱
          this.showInbox();
      }
      
      // 更新 sessionStorage 中的当前视图
      try {
        sessionStorage.setItem('mf:currentView', hash);
      } catch(_) {}
    },
    
    // 显示收件箱
    showInbox() {
      if (typeof window.switchToInbox === 'function') {
        window.switchToInbox();
        // 更新 URL - 只在用户主动导航时创建历史记录，避免重复记录
        if (location.hash !== '#inbox') {
          // 检查是否是浏览器前进后退触发，如果是则不再创建新记录
          const isPopstateNavigation = this.isHandlingPopstate;
          if (!isPopstateNavigation) {
            history.pushState({ mfView: 'inbox', timestamp: Date.now() }, '', '#inbox');
          }
        }
      }
      this.updateActiveNav('inbox');
    },
    
    // 显示发件箱
    showSent() {
      if (typeof window.switchToSent === 'function') {
        window.switchToSent();
        // 更新 URL - 只在用户主动导航时创建历史记录，避免重复记录
        if (location.hash !== '#sent') {
          // 检查是否是浏览器前进后退触发，如果是则不再创建新记录
          const isPopstateNavigation = this.isHandlingPopstate;
          if (!isPopstateNavigation) {
            history.pushState({ mfView: 'sent', timestamp: Date.now() }, '', '#sent');
          }
        }
      }
      this.updateActiveNav('sent');
    },
    
    // 显示生成邮箱（主要用于统一路由）
    showGenerate() {
      // 电脑端生成邮箱始终显示，这里主要是更新 URL
      this.updateActiveNav('generate');
      if (location.hash !== '#generate') {
        history.pushState({ mfView: 'generate' }, '', '#generate');
      }
      try {
        const genCard = document.querySelector('.generate-card');
        if (genCard) genCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch(_) {}
    },
    
    // 显示历史邮箱（主要用于统一路由）
    showHistory() {
      // 电脑端历史邮箱始终显示，这里主要是更新 URL
      this.updateActiveNav('history');
      if (location.hash !== '#history') {
        history.pushState({ mfView: 'history' }, '', '#history');
      }
      try {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch(_) {}
    },
    
    // 更新导航激活状态
    updateActiveNav(view) {
      // 更新收件箱/发件箱标签
      if (view === 'inbox' || view === 'mail') {
        const tabInbox = document.getElementById('tab-inbox');
        const tabSent = document.getElementById('tab-sent');
        if (tabInbox) tabInbox.setAttribute('aria-pressed', 'true');
        if (tabSent) tabSent.setAttribute('aria-pressed', 'false');
      } else if (view === 'sent') {
        const tabInbox = document.getElementById('tab-inbox');
        const tabSent = document.getElementById('tab-sent');
        if (tabInbox) tabInbox.setAttribute('aria-pressed', 'false');
        if (tabSent) tabSent.setAttribute('aria-pressed', 'true');
      }
    },
    
    // 绑定导航事件
    bindNavigationEvents() {
      // 重写收件箱/发件箱切换按钮的点击事件
      setTimeout(() => {
        const tabInbox = document.getElementById('tab-inbox');
        const tabSent = document.getElementById('tab-sent');
        
        if (tabInbox) {
          // 保存原始的点击处理函数
          const originalInboxClick = tabInbox.onclick;
          tabInbox.onclick = (e) => {
            e.preventDefault();
            this.navigate('inbox');
            // 如果有原始处理函数，也执行它
            if (typeof originalInboxClick === 'function') {
              originalInboxClick.call(tabInbox, e);
            }
          };
        }
        
        if (tabSent) {
          // 保存原始的点击处理函数
          const originalSentClick = tabSent.onclick;
          tabSent.onclick = (e) => {
            e.preventDefault();
            this.navigate('sent');
            // 如果有原始处理函数，也执行它
            if (typeof originalSentClick === 'function') {
              originalSentClick.call(tabSent, e);
            }
          };
        }
      }, 500); // 延迟确保按钮已创建
    },
    
    // 导航到指定路由
    navigate(route) {
      // 确保路由以 # 开头
      const targetHash = `#${route}`;
      
      if (location.hash === targetHash) {
        // 如果已在目标路由，手动触发处理
        this.currentView = null;
        this.handleRoute();
      } else {
        // 更新 URL，会自动触发 hashchange 事件
        // 直接设置 location.hash 会自动创建历史记录条目
        location.hash = route;
      }
    },
    
    // 用于其他地方调用的导航方法
    goToInbox() { this.navigate('inbox'); },
    goToSent() { this.navigate('sent'); },
    goToGenerate() { this.navigate('generate'); },
    goToHistory() { this.navigate('history'); }
  };
  
  // 页面加载完成后初始化路由
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RouteManager.init());
  } else {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => RouteManager.init(), 500);
  }
  
  // 导出路由管理器供其他模块使用
  window.RouteManager = RouteManager;
})();
