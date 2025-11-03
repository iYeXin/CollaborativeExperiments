// config.js - 重构为默认配置提供者，但主要配置由外部传入
const path = require('path');
const fs = require('fs');

// 默认工具列表
const defaultTools = [
    {
        name: 'get_tool_detail',
        description: '获取功能详情',
        parameters: { tool_name: 'string' },
        isMeta: true
    },
    {
        name: 'search_tools',
        description: '搜索相关功能',
        parameters: { keywords: 'string' },
        isMeta: true
    },
    {
        name: 'list_tools',
        description: '列出所有功能',
        parameters: {},
        isMeta: true
    },
    {
        name: 'jscode_execution',
        description: '执行JavaScript代码，注意要在最后一行单独写一个 result，将返回你所构建的 result 变量的值',
        parameters: { code: 'string', referenceData: { type: 'array', description: '你需要引用的数据，传入数组形式的标识符，然后你可以在代码中通过 referenceData[0] 等方式使用这些数据' } },
        isMeta: false
    },
    {
        name: 'test:get_weather',
        description: '获取天气信息',
        parameters: {},
        isMeta: false
    }
];

// 默认模块路径
const defaultModules = {
    message: path.join(__dirname, 'modules', 'message.js'),
    analysis: path.join(__dirname, 'modules', 'analysis.js'),
    execution: path.join(__dirname, 'modules', 'execution.js'),
};

// 默认系统提示词
const defaultSystemPrompt = fs.readFileSync(path.join(__dirname, 'blank_prompt.md'), 'utf8');

// 默认执行器
async function testExecutor(toolName, parameters, ctx) {
    switch (toolName) {
        case 'get_weather':
            return { temperature: 25, condition: 'Sunny' };
    }
}

const defaultExecutorMap = {
    'test': testExecutor,
}

module.exports = {
    defaultTools,
    defaultModules,
    defaultSystemPrompt,
    // 其他默认配置,
    defaultExecutorMap,
    maxRecursionDepth: 100,
    timeoutMs: 30000000,
};
