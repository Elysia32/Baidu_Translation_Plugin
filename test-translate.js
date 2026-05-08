const http = require('http');
const crypto = require('crypto');

// 百度翻译 API 配置 - 两种组合测试
const appId = '';
const apiKey1 = '';
const secretKey1 = '';


// 测试文本
const text = 'Hello World';

function testWithKeys(apiKey, secretKey, label) {
  console.log(`\n=== 测试 ${label} ===`);

  const salt = Math.random().toString(36).substring(2);
  // 签名：MD5(appid + q + salt + apiKey)
  const signStr = `${appId}${text}${salt}${apiKey}`;
  const sign = crypto.createHash('md5').update(signStr).digest('hex');

  const postData = `q=${encodeURIComponent(text)}&from=en&to=zh&appid=${appId}&salt=${salt}&sign=${sign}`;

  const options = {
    hostname: 'api.fanyi.baidu.com',
    path: '/api/trans/vip/translate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      if (result.error_code) {
        console.log(`�? 失败: ${result.error_msg}`);
      } else {
        console.log(`�? 成功！翻译结�?: ${result.trans_result.map(r => r.dst).join('\n')}`);
      }
    });
  });

  req.on('error', (e) => {
    console.log('请求错误:', e.message);
  });

  req.write(postData);
  req.end();
}

testWithKeys(apiKey1, secretKey1, '组合1 (apiKey1 + secretKey1)');
