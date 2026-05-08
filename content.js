// 悬浮翻译按钮样式
const style = document.createElement('style');
style.textContent = `
  .translate-float-btn {
    position: fixed;
    background: #4285f4;
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 9999;
    white-space: nowrap;
    user-select: none;
  }
  .translate-float-btn:hover {
    background: #3367d6;
  }
  .translate-float-btn.translating {
    background: #9aaa56;
    cursor: wait;
  }

  .translate-float-result {
    position: fixed;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    color: #333;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    z-index: 9998;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    line-height: 1.8;
  }

  .translate-float-result::-webkit-scrollbar {
    width: 6px;
  }
  .translate-float-result::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }

  .translate-source {
    color: #666;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .translate-dest {
    color: #1976d2;
    font-size: 15px;
    font-weight: 500;
  }
`;
document.head.appendChild(style);

let selectedText = '';
let btn = null;
let resultBox = null;
let resultTimer = null;
let selectionRect = null;

// 创建悬浮按钮
function createFloatBtn(x, y, text) {
  if (btn) btn.remove();

  btn = document.createElement('div');
  btn.className = 'translate-float-btn';
  btn.textContent = '翻译';
  btn.style.left = x + 'px';
  btn.style.top = y + 'px';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn) btn.remove();
    btn = null;
    translateText(text);
  });

  document.body.appendChild(btn);
}

// 创建结果框
function createResultBox(x, y, source, dest) {
  if (resultBox) resultBox.remove();

  resultBox = document.createElement('div');
  resultBox.className = 'translate-float-result';
  resultBox.innerHTML = `
    <div class="translate-source">${source}</div>
    <div class="translate-dest">${dest}</div>
  `;
  resultBox.style.left = x + 'px';
  resultBox.style.top = y + 'px';

  document.body.appendChild(resultBox);

  // 点击结果框外部关闭
  const closeHandler = (ev) => {
    if (resultBox && ev.target !== resultBox && !resultBox.contains(ev.target)) {
      resultBox.remove();
      resultBox = null;
      document.removeEventListener('click', closeHandler);
    }
  };
  document.addEventListener('click', closeHandler);

  // 5秒后自动隐藏
  if (resultTimer) clearTimeout(resultTimer);
  resultTimer = setTimeout(() => {
    if (resultBox) {
      resultBox.remove();
      resultBox = null;
    }
  }, 5000);
}

// 翻译请求 - 通过 background.js 转发
function translateText(text) {
  if (!text) return;

  selectedText = text;

  // 通过 background service worker 发送翻译请求
  chrome.runtime.sendMessage(
    { action: 'translate', payload: { text } },
    (response) => {
      // 计算结果框位置（在选中文字下方）
      let x, y;
      if (selectionRect) {
        x = selectionRect.left;
        y = selectionRect.bottom + 8;
        // 防止超出右边界
        if (x + 300 > window.innerWidth) {
          x = window.innerWidth - 320;
        }
        // 防止超出下边界，超出则显示在上方
        if (y + 100 > window.innerHeight) {
          y = selectionRect.top - 108;
        }
      } else {
        x = window.innerWidth / 2 - 150;
        y = window.innerHeight / 2 - 50;
      }

      if (!response) {
        createResultBox(x, y, text, '请求失败：无法连接到后台服务');
        return;
      }
      if (response.error) {
        createResultBox(x, y, text, `翻译失败: ${response.error}`);
      } else if (response.result && response.result.length > 0) {
        const destText = response.result.map(r => r.dst).join('\n');
        createResultBox(x, y, text, destText);
      } else {
        createResultBox(x, y, text, '翻译结果为空');
      }
    }
  );
}

// 监听鼠标划选
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  // 只处理英文文本（至少包含字母，且不含中文）
  if (text && /[a-zA-Z]/.test(text) && !/[\u4e00-\u9fa5]/.test(text)) {
    // 隐藏已有按钮
    if (btn) {
      btn.remove();
      btn = null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      // 保存选中区域位置
      selectionRect = rect;

      // 计算按钮位置（在选中文字上方）
      const btnWidth = 60;
      const btnHeight = 34;
      const x = Math.min(Math.max(rect.left, 5), window.innerWidth - btnWidth - 5);
      const y = Math.min(Math.max(rect.top - btnHeight - 8, 5), window.innerHeight - btnHeight - 5);

      createFloatBtn(x, y, text);
    }
  } else {
    if (btn) {
      btn.remove();
      btn = null;
    }
    if (resultBox) {
      resultBox.remove();
      resultBox = null;
    }
  }
});

// 滚动时隐藏
window.addEventListener('scroll', () => {
  if (btn) {
    btn.remove();
    btn = null;
  }
  if (resultBox) {
    resultBox.remove();
    resultBox = null;
  }
});

window.addEventListener('resize', () => {
  if (btn) {
    btn.remove();
    btn = null;
  }
  if (resultBox) {
    resultBox.remove();
    resultBox = null;
  }
});
