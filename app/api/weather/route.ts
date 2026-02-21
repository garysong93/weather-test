import { NextResponse } from 'next/server';

// 在运行时获取环境变量（而不是在模块加载时）
function getApiKey(): string {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('环境变量检查:');
    console.error('- OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY);
    console.error('- 所有环境变量:', Object.keys(process.env).filter(k => k.includes('WEATHER')));
    throw new Error('OPENWEATHER_API_KEY 环境变量未设置。请确保：\n1. .env.local 文件存在\n2. 文件内容为: OPENWEATHER_API_KEY=你的API密钥\n3. 已重启开发服务器 (npm run dev)');
  }
  return apiKey;
}

// OpenWeatherMap 天气代码映射
const weatherCodeMap: Record<number, number> = {
  // 将 OpenWeatherMap 的天气代码映射到类似 open-meteo 的格式
  // OpenWeatherMap: 200-232 (雷暴), 300-321 (毛毛雨), 500-531 (雨), 600-622 (雪), 701-781 (大气), 800 (晴), 801-804 (云)
  200: 95, 201: 95, 202: 95, 210: 95, 211: 95, 212: 95, 221: 95, 230: 96, 231: 96, 232: 96,
  300: 51, 301: 51, 302: 53, 310: 53, 311: 53, 312: 55, 313: 55, 314: 55, 321: 55,
  500: 61, 501: 63, 502: 65, 503: 65, 504: 65, 511: 66, 520: 80, 521: 81, 522: 82, 531: 82,
  600: 71, 601: 73, 602: 75, 611: 66, 612: 66, 613: 66, 615: 66, 616: 66, 620: 85, 621: 86, 622: 86,
  701: 45, 711: 45, 721: 45, 731: 45, 741: 45, 751: 45, 761: 45, 762: 45, 771: 45, 781: 45,
  800: 0,
  801: 1, 802: 2, 803: 3, 804: 3,
};

function mapWeatherCode(owmCode: number): number {
  return weatherCodeMap[owmCode] ?? 0;
}

// 城市名称映射：中文 -> 英文（OpenWeatherMap API 需要英文城市名）
const cityNameMap: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '成都': 'Chengdu',
  '重庆': 'Chongqing',
  '西安': 'Xi\'an',
  '南京': 'Nanjing',
  '武汉': 'Wuhan',
  '天津': 'Tianjin',
  '苏州': 'Suzhou',
  '长沙': 'Changsha',
  '郑州': 'Zhengzhou',
  '东莞': 'Dongguan',
  '青岛': 'Qingdao',
  '沈阳': 'Shenyang',
  '宁波': 'Ningbo',
  '昆明': 'Kunming',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '合肥': 'Hefei',
  '佛山': 'Foshan',
  '福州': 'Fuzhou',
  '哈尔滨': 'Harbin',
  '济南': 'Jinan',
  '温州': 'Wenzhou',
  '石家庄': 'Shijiazhuang',
  '泉州': 'Quanzhou',
  '长春': 'Changchun',
  '贵阳': 'Guiyang',
  '南昌': 'Nanchang',
  '伦敦': 'London',
  '纽约': 'New York',
  '东京': 'Tokyo',
  '巴黎': 'Paris',
  '悉尼': 'Sydney',
  '新加坡': 'Singapore',
  '首尔': 'Seoul',
  '曼谷': 'Bangkok',
};

// 将城市名转换为 OpenWeatherMap API 可识别的格式
function normalizeCityName(city: string): string {
  // 如果映射表中存在，使用英文名
  if (cityNameMap[city]) {
    return cityNameMap[city];
  }
  // 如果已经是英文或拼音，直接返回
  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(city);
  if (!hasChinese) {
    return city;
  }
  // 如果包含中文但不在映射表中，尝试直接使用（可能 API 支持）
  return city;
}

export async function GET(request: Request) {
  try {
    // 在运行时获取 API Key
    const API_KEY = getApiKey();
    
    // 记录 API Key 前4位用于诊断（不暴露完整 key）
    const apiKeyPrefix = API_KEY.substring(0, 4);
    console.log(`使用 API Key: ${apiKeyPrefix}...`);

    const { searchParams } = new URL(request.url);
    const inputCity = searchParams.get('city') || '深圳';
    const city = normalizeCityName(inputCity);
    
    console.log(`输入城市: ${inputCity} -> 转换后: ${city}`);

    // 获取当前天气
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_cn`;
    
    // 获取5天预报（每3小时一次，共40个数据点）
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_cn`;

    console.log(`请求城市: ${city} (原始: ${inputCity})`);
    console.log(`当前天气 API: ${currentUrl.replace(API_KEY, '***')}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl, { signal: controller.signal, next: { revalidate: 300 } }),
      fetch(forecastUrl, { signal: controller.signal, next: { revalidate: 300 } }),
    ]);

    clearTimeout(timeoutId);

    if (!currentResponse.ok) {
      const errorData = await currentResponse.json().catch(() => ({}));
      console.error('当前天气 API 错误:', {
        status: currentResponse.status,
        statusText: currentResponse.statusText,
        errorData,
      });
      
      let errorMsg = errorData.message || '';
      
      // 处理 401 错误
      if (currentResponse.status === 401 || errorData.cod === 401 || errorData.cod === '401') {
        if (errorMsg.includes('Invalid API key') || errorMsg.includes('invalid api key')) {
          errorMsg = `API Key 无效。请检查：
1. API Key 是否正确（当前: ${API_KEY.substring(0, 4)}...）
2. API Key 是否已激活（注册后需要等待最多2小时）
3. 访问 https://openweathermap.org/api_keys 确认 API Key 状态`;
        } else {
          errorMsg = `API Key 认证失败 (401)。可能原因：
1. API Key 未激活（注册后需要等待最多2小时激活）
2. API Key 错误（请检查 .env.local 文件中的 OPENWEATHER_API_KEY）
3. 使用了错误的 API Key
请访问 https://openweathermap.org/api_keys 检查你的 API Key 状态`;
        }
      } else if (errorData.cod === 404 || errorData.cod === '404') {
        errorMsg = `未找到城市: ${inputCity}${inputCity !== city ? ` (尝试: ${city})` : ''}`;
      } else if (errorData.cod === 429 || errorData.cod === '429') {
        errorMsg = 'API 调用次数超限，请稍后再试';
      } else if (!errorMsg) {
        errorMsg = `获取天气数据失败: ${currentResponse.status} ${currentResponse.statusText}`;
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch weather data',
          message: errorMsg,
          details: errorData
        },
        { status: currentResponse.status }
      );
    }

    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json().catch(() => ({}));
      console.error('预报 API 错误:', {
        status: forecastResponse.status,
        statusText: forecastResponse.statusText,
        errorData,
      });
      
      let errorMsg = errorData.message || '';
      
      // 处理 401 错误
      if (forecastResponse.status === 401 || errorData.cod === 401 || errorData.cod === '401') {
        if (errorMsg.includes('Invalid API key') || errorMsg.includes('invalid api key')) {
          errorMsg = `API Key 无效。请检查：
1. API Key 是否正确（当前: ${API_KEY.substring(0, 4)}...）
2. API Key 是否已激活（注册后需要等待最多2小时）
3. 访问 https://openweathermap.org/api_keys 确认 API Key 状态`;
        } else {
          errorMsg = `API Key 认证失败 (401)。可能原因：
1. API Key 未激活（注册后需要等待最多2小时激活）
2. API Key 错误（请检查 .env.local 文件中的 OPENWEATHER_API_KEY）
3. 使用了错误的 API Key
请访问 https://openweathermap.org/api_keys 检查你的 API Key 状态`;
        }
      } else if (errorData.cod === 404 || errorData.cod === '404') {
        errorMsg = `未找到城市: ${inputCity}${inputCity !== city ? ` (尝试: ${city})` : ''}`;
      } else if (errorData.cod === 429 || errorData.cod === '429') {
        errorMsg = 'API 调用次数超限，请稍后再试';
      } else if (!errorMsg) {
        errorMsg = `获取预报数据失败: ${forecastResponse.status} ${forecastResponse.statusText}`;
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch forecast data',
          message: errorMsg,
          details: errorData
        },
        { status: forecastResponse.status }
      );
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // 转换数据格式以匹配前端组件期望的格式
    const now = new Date();
    // 使用原始输入的城市名（中文），如果不在映射表中则使用 API 返回的名称
    const cityName = inputCity !== city ? inputCity : (currentData.name || inputCity);
    const latitude = currentData.coord.lat;
    const longitude = currentData.coord.lon;

    // 当前天气
    const currentWeather = {
      temperature: currentData.main.temp,
      weathercode: mapWeatherCode(currentData.weather[0].id),
      windspeed: currentData.wind.speed * 3.6, // m/s 转 km/h
      winddirection: currentData.wind.deg || 0,
      time: new Date(currentData.dt * 1000).toISOString(),
    };

    // 处理每日数据（从预报中提取）
    const dailyMap = new Map<string, { max: number; min: number; codes: number[] }>();
    
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const temp = item.main.temp;
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { max: temp, min: temp, codes: [] });
      }
      
      const dayData = dailyMap.get(dateKey)!;
      dayData.max = Math.max(dayData.max, temp);
      dayData.min = Math.min(dayData.min, temp);
      dayData.codes.push(mapWeatherCode(item.weather[0].id));
    });

    // 生成7天数据
    const dailyTime: string[] = [];
    const dailyMax: number[] = [];
    const dailyMin: number[] = [];
    const dailyCodes: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (i === 0) {
        // 今天使用当前天气数据
        dailyTime.push(now.toISOString());
        dailyMax.push(currentData.main.temp_max);
        dailyMin.push(currentData.main.temp_min);
        dailyCodes.push(mapWeatherCode(currentData.weather[0].id));
      } else {
        const dayData = dailyMap.get(dateKey);
        if (dayData) {
          dailyTime.push(date.toISOString());
          dailyMax.push(dayData.max);
          dailyMin.push(dayData.min);
          // 使用最常见的天气代码
          const mostCommonCode = dayData.codes.reduce((a, b, _, arr) => 
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          );
          dailyCodes.push(mostCommonCode);
        } else {
          // 如果没有数据，使用前一天的数据
          dailyTime.push(date.toISOString());
          dailyMax.push(dailyMax[dailyMax.length - 1]);
          dailyMin.push(dailyMin[dailyMin.length - 1]);
          dailyCodes.push(dailyCodes[dailyCodes.length - 1]);
        }
      }
    }

    // 生成24小时数据（从预报中提取）
    const hourlyTime: string[] = [];
    const hourlyTemp: number[] = [];
    const hourlyHumidity: number[] = [];
    const hourlyCodes: number[] = [];

    // 添加当前时间的数据
    hourlyTime.push(now.toISOString());
    hourlyTemp.push(currentData.main.temp);
    hourlyHumidity.push(currentData.main.humidity);
    hourlyCodes.push(mapWeatherCode(currentData.weather[0].id));

    // 从预报中提取未来23小时的数据
    forecastData.list.slice(0, 8).forEach((item: any) => {
      const itemTime = new Date(item.dt * 1000);
      if (itemTime > now) {
        hourlyTime.push(itemTime.toISOString());
        hourlyTemp.push(item.main.temp);
        hourlyHumidity.push(item.main.humidity);
        hourlyCodes.push(mapWeatherCode(item.weather[0].id));
      }
    });

    // 如果不足24小时，用最后一个数据填充
    while (hourlyTime.length < 24) {
      const lastTime = new Date(hourlyTime[hourlyTime.length - 1]);
      lastTime.setHours(lastTime.getHours() + 1);
      hourlyTime.push(lastTime.toISOString());
      hourlyTemp.push(hourlyTemp[hourlyTemp.length - 1]);
      hourlyHumidity.push(hourlyHumidity[hourlyHumidity.length - 1]);
      hourlyCodes.push(hourlyCodes[hourlyCodes.length - 1]);
    }

    const result = {
      city: cityName,
      latitude,
      longitude,
      current_weather: currentWeather,
      daily: {
        time: dailyTime,
        weathercode: dailyCodes,
        temperature_2m_max: dailyMax,
        temperature_2m_min: dailyMin,
      },
      hourly: {
        time: hourlyTime.slice(0, 24),
        temperature_2m: hourlyTemp.slice(0, 24),
        relative_humidity_2m: hourlyHumidity.slice(0, 24),
        weathercode: hourlyCodes.slice(0, 24),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Weather API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
