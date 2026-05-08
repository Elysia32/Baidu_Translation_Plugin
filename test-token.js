const http = require('http');
const crypto = require('crypto');

// 百度翻译 API 配置
const appId = '';
const apiKey = '';
const secretKey = '';

const text = 'Hello World';

// 百度翻译 API v2 - 使用 access_token
function testWithAccessToken() {
  console.log('=== 1. 获取 Access Token ===');

  const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: secretKey
  });

  http.request({
    hostname: 'aip.baidubce.com',
    path: `/oauth/2.0/token?${params.toString()}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const tokenResult = JSON.parse(data);
      console.log('Token 响应:', JSON.stringify(tokenResult, null, 2));

      if (tokenResult.access_token) {
        const accessToken = tokenResult.access_token;
        console.log('\n=== 2. 使用 Access Token 调用翻译 API ===');

        const translateUrl = `https://fanyi-api.baidu.com/api/trans/vip/translate?access_token=${accessToken}`;

        const postData = `q=${encodeURIComponent(text)}&from=en&to=zh`;

        http.request({
          hostname: 'fanyi-api.baidu.com',
          path: `/api/trans/vip/translate?access_token=${accessToken}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            console.log('翻译响应:', data2);
            const result = JSON.parse(data2);
            if (result.error_code) {
              console.log(`�? 翻译失败: ${result.error_msg}`);
            } else {
              console.log(`�? 成功！翻译结�?: ${result.trans_result.map(r => r.dst).join('\n')}`);
            }
          });
        }).on('error', (e) => {
          console.log('请求错误:', e.message);
        }).write(postData);
      }
    });
  }).on('error', (e) => {
    console.log('Token 请求错误:', e.message);
  }).end();
}

testWithAccessToken();
