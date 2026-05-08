document.addEventListener('DOMContentLoaded', () => {
  const appIdInput = document.getElementById('appId');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');
  const apiStatus = document.getElementById('apiStatus');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');
  const translateInput = document.getElementById('translateInput');
  const translateBtn = document.getElementById('translateBtn');
  const resultGroup = document.getElementById('resultGroup');
  const resultBox = document.getElementById('resultBox');

  let statusTimer = null;

  // 加载已保存的配置
  chrome.storage.sync.get(['baiduAppId', 'baiduApiKey'], (items) => {
    if (items.baiduAppId) {
      appIdInput.value = items.baiduAppId;
    }
    if (items.baiduApiKey) {
      apiKeyInput.value = items.baiduApiKey;
    }
    updateApiStatus(!!items.baiduAppId && !!items.baiduApiKey);
  });

  function updateApiStatus(configured) {
    if (configured) {
      apiStatus.className = 'api-status';
      statusText.textContent = 'API已配置';
      statusDot.className = 'status-dot connected';
    } else {
      apiStatus.className = 'api-status';
      statusText.textContent = 'API未配置';
      statusDot.className = 'status-dot disconnected';
    }
  }

  function showStatus(message, isSuccess) {
    if (statusTimer) clearTimeout(statusTimer);
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + (isSuccess ? 'success' : 'error');
    statusMessage.style.display = 'block';

    statusTimer = setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  saveBtn.addEventListener('click', () => {
    const appId = appIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!appId || !apiKey) {
      showStatus('请输入APP ID和API Key', false);
      return;
    }

    chrome.storage.sync.set({
      baiduAppId: appId,
      baiduApiKey: apiKey
    }, () => {
      updateApiStatus(true);
      showStatus('配置保存成功！', true);
    });
  });

  // 手动翻译功能
  translateBtn.addEventListener('click', () => {
    const text = translateInput.value.trim();
    if (!text) {
      showStatus('请输入要翻译的文本', false);
      return;
    }

    translateBtn.textContent = '翻译中...';
    translateBtn.disabled = true;

    chrome.runtime.sendMessage(
      { action: 'translate', payload: { text } },
      (response) => {
        translateBtn.textContent = '翻译';
        translateBtn.disabled = false;

        if (chrome.runtime.lastError) {
          showStatus('翻译失败: ' + chrome.runtime.lastError.message, false);
          return;
        }

        if (!response) {
          showStatus('翻译失败: 后台无响应', false);
          return;
        }

        if (response.error) {
          showStatus('翻译失败: ' + response.error, false);
        } else if (response.result) {
          const translated = response.result.map(item => item.dst).join('\n');
          resultBox.textContent = translated;
          resultGroup.style.display = 'block';
        } else {
          showStatus('翻译失败: 未知错误', false);
        }
      }
    );
  });
});
