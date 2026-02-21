// 测试 OpenWeatherMap API Key
const API_KEY = 'e53277a152fff13f2614424e59fa0753';

async function testAPI() {
  console.log('测试 OpenWeatherMap API...');
  console.log(`API Key: ${API_KEY.substring(0, 4)}...`);
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Shenzhen&appid=${API_KEY}&units=metric`;
    console.log(`请求 URL: ${url.replace(API_KEY, '***')}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`状态码: ${response.status}`);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API Key 有效！');
    } else {
      console.log('❌ API Key 无效或有问题');
      if (data.cod === 401) {
        console.log('错误原因: 401 Unauthorized');
        console.log('可能的原因:');
        console.log('1. API Key 未激活（注册后需要等待最多2小时）');
        console.log('2. API Key 错误');
        console.log('3. 使用了错误的 API Key');
      }
    }
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testAPI();
