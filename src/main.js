const { AIAgentSystem } = require('./base-beta/agent');
const { SharedWorld } = require('./base-beta/shared-world');
const analysisModule = require('./base-beta/modules/analysis');
const executionModule = require('./base-beta/modules/execution');
const messageModule = require('./base-beta/modules/message');
const defaultConfig = require('./base-beta/config');
const blankPrompt = require('./prompt/blank')
const operations = require('./tools/utils/tools.json');
const fs = require('fs');
const process = require('process');
const { frontendDevelopDocs, buildDoc } = require('./tools/utils/docs')

// 创建共享世界实例
const sharedWorld = new SharedWorld();

const toolkits = {
    'utils': {
        'tools': './tools/utils/tools.json',
        'executor': './tools/utils/utils.js',
        'config': {
            sharedWorld: sharedWorld,
            initialFileEntities: [
                // 预置项目基础文件
                {
                    eid: 'project_readme_base',
                    type: "file",
                    data: {
                        name: "README.md",
                        content: "# 项目开发协作空间\n\n这是一个基于Niva框架的桌面应用开发项目。\n\n## 开发团队\n- 项目经理 (project_manager)\n- 前端开发人员 (frontend_dev_1, frontend_dev_2)\n- 构建专员 (build_specialist)\n\n## 开发规范\n1. 所有代码文件使用UTF-8编码\n2. HTML/CSS/JavaScript遵循标准规范\n3. 项目结构统一管理\n4. 定期同步开发进度",
                        fileType: "md",
                        createdBy: "system",
                        createdAt: new Date().toISOString()
                    },
                    isGlobal: true
                }
            ]
        }
    },
}

const collaborationRecords = []

// 动态加载工具包
function loadToolkit(name, toolkitConfig) {
    try {
        const tools = require(toolkitConfig.tools);

        let executor;
        if (toolkitConfig.executor.includes('::')) {
            const [modulePath, constructorName] = toolkitConfig.executor.split('::');
            const module = require(modulePath);
            executor = module[constructorName](toolkitConfig.config);
        } else {
            const module = require(toolkitConfig.executor);
            executor = module(toolkitConfig.config);
        }

        return { tools, executor };
    } catch (error) {
        console.error(`加载工具包 ${name} 时出错:`, error);
        return { tools: [], executor: null };
    }
}

// 创建多个Agent系统实例
async function createAgentSystems(agentConfigs) {
    const allTools = [];
    const executorMap = { ...defaultConfig.defaultExecutorMap };

    // 加载所有配置的工具包
    for (const [name, toolkitConfig] of Object.entries(toolkits)) {
        const { tools, executor } = loadToolkit(name, toolkitConfig);

        if (tools && tools.length) {
            allTools.push(...tools);
        }

        if (executor) {
            executorMap[name] = executor;
        }
    }

    const agents = [];

    buildSystemPrompt(agentConfigs);

    for (const config of agentConfigs) {
        const agent = new AIAgentSystem({
            openaiConfig: {
                baseURL: 'https://api.deepseek.com',
                apiKey: process.env.DEEPSEEK_API,
                model: 'deepseek-chat',
                temperature: 0.5
                // baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',  // 阿里云
                // apiKey: process.env.ALI_API || 'API_KEY',  // 从环境变量获取API密钥
                // model: 'qwen-plus',  // 小屋实验使用模型  基于 2025-11-03 日
                // temperature: 0.5
            },
            msgType: 'text',
            msgContent: config.initialMessage,
            senderId: 'user',
            systemPrompt: config.systemPrompt || defaultConfig.defaultSystemPrompt,
            tools: allTools,
            executorMap: executorMap,
            modules: {
                analysis: analysisModule,
                execution: executionModule,
                message: messageModule
            },
            onAIMessage: (data) => {
                collaborationRecords.push({
                    type: 'agent',
                    agentId: data.agentId,
                    response: data.response,
                    timeStamp: new Date()
                });
                console.log(`[${data.agentId}] ${data.response}`)
            },
            streamOutput: false,
            sharedWorld: sharedWorld,
            agentId: config.agentId,
            role: config.role
        });

        agents.push(agent);
    }

    return agents;
}

function buildSystemPrompt(agentConfigs) {
    for (const config of agentConfigs) {
        if (!config.systemPrompt) {
            let prompt = blankPrompt;
            let availableTools = [];
            if (config.availableTools === 'all' || !config.availableTools) {
                availableTools = JSON.stringify(operations, null, 2)
            } else {
                availableTools = JSON.stringify(operations.filter(op => config.availableTools.includes(op.name)), null, 2)
            }
            prompt = prompt.replace('{{INITIAL_INPUT}}', config.initialMessage)
                .replace('{{ROLE_DEFINITION}}', config.roleDefinition)
                .replace('{{OPERATIONS}}', availableTools);
            config.systemPrompt = prompt;
        }
    }
}

// 启动软件协同开发实验
async function main() {
    try {
        // 定义软件开发团队配置
        const agentConfigs = [
            {
                agentId: 'project_manager',
                role: '项目经理',
                initialMessage: '我们接到一个新的桌面应用开发项目，是一个计算器应用，实现基础的四则运算功能，3个文件，一个style.css，一个index.js，一个index.js。我需要协调前端开发团队分工，并安排构建任务。请各位开发人员报告当前状态和专长。在等待时间，我需要用 wait_for_some_time 操作。',
                roleDefinition: `你是软件开发项目的项目经理，负责整体协调和进度管理。

团队成员：
- frontend_dev_1: 前端开发人员1，负责页面开发
- frontend_dev_2: 前端开发人员2，负责页面开发  
- build_specialist: 构建专员，负责应用构建

核心职责：
1. 项目需求分析和任务分解
2. 分配开发任务给前端开发人员
3. 协调开发进度和代码整合
4. 安排构建测试和版本发布
5. 解决团队协作中的问题
6. 在开发工作完成后，将所有文件实体的eid和说明交给build_specialist进行构建
7. 只有当任务结束，拿到构建的可执行文件的eid后，才可以表示项目结束，并在离开前向所有人员宣布可以离开，收到结果后你才能够退出世界
8. 在退出世界的message中，必须用{{exe_path:Path}}的形式包裹可执行文件的路径，用{{exe_eid:EID}}的形式包裹可执行文件的eid，用{{project_path:Path}}的形式包裹项目文件路径

注意：不能猜测实体ID，必须向开发人员获取

开发规范：
- 使用Niva框架开发Windows桌面应用
- 前端技术：HTML/CSS/JavaScript，支持Vue3/Bootstrap
- 所有代码文件使用UTF-8编码
- 定期同步开发进度

沟通要求：
- 只有开发人员了解如何实现和能力边界，不要自行决定，先于开发人员商讨
- 必须组织开发人员，先商讨项目结构，在商讨文件分工，然后商讨接口定义，最后开始并行开发，千万不要着急
- 由于交流操作的问题，其他人可能会慢一步响应，请谅解他们
- 明确指定消息接收对象（使用agentId）
- 重要决策需要团队确认
- 构建请求必须发送给build_specialist`,
                availableTools: [
                    'utils:get_global_entity',
                    'utils:send_message',
                    'utils:broadcast_message',
                    'utils:wait_for_some_time',
                    'utils:leave_world'
                ]
            },
            {
                agentId: 'frontend_dev_1',
                role: '前端开发人员1',
                initialMessage: '我是前端开发人员1，擅长HTML/CSS布局和基础JavaScript功能。我可以负责开发应用的首页和基础界面组件，在没有收到项目经理指示的情况下，我需要用 wait_for_some_time 操作等待一段时间。',
                roleDefinition: `你是前端开发人员1，负责页面开发和界面实现。

团队成员：
- project_manager: 项目经理，负责任务分配和协调
- frontend_dev_2: 前端开发人员2，协作开发
- build_specialist: 构建专员，负责应用构建

核心职责：
1. 根据项目经理分配开发页面和组件
2. 编写高质量的HTML/CSS/JavaScript代码
3. 与frontend_dev_2协作确保界面一致性
4. 遵循项目开发规范和代码标准
5. 及时向项目经理汇报开发进度
6. 你不需要编写 niva.json 文件，这由构建专员负责

相关文档：

${frontendDevelopDocs}

重要提醒：
- 先商讨，后开发
- 由于交流操作的问题，其他人可能会慢一步响应，请谅解他们
- 如果你要和其他开发人员协作，请提前商议好接口
- 不要直接进行构建操作，构建由build_specialist负责
- 遇到技术问题先与frontend_dev_2讨论
- 任务分配和进度汇报找project_manager`,
                availableTools: [
                    'utils:create_file_entity',
                    'utils:read_file_lines',
                    'utils:edit_file_lines',
                    'utils:get_file_entity',
                    'utils:search_in_files',
                    'utils:get_global_entity',
                    'utils:send_message',
                    'utils:broadcast_message',
                    'utils:wait_for_some_time',
                    'utils:leave_world'
                ]
            },
            {
                agentId: 'frontend_dev_2',
                role: '前端开发人员2',
                initialMessage: '我是前端开发人员2，擅长JavaScript交互逻辑和复杂组件开发。我可以负责开发应用的功能页面和动态组件。在没有收到项目经理指示的情况下，我需要用 wait_for_some_time 操作等待一段时间。',
                roleDefinition: `你是前端开发人员2，负责功能开发和复杂组件实现。

团队成员：
- project_manager: 项目经理，负责任务分配和协调
- frontend_dev_1: 前端开发人员1，协作开发
- build_specialist: 构建专员，负责应用构建

核心职责：
1. 开发复杂JavaScript功能和交互逻辑
2. 实现动态组件和数据绑定
3. 与frontend_dev_1协作确保功能完整性
4. 处理用户交互和状态管理
5. 优化应用性能和用户体验
6. 你不需要编写 niva.json 文件，这由构建专员负责

相关文档：

${frontendDevelopDocs}

重要提醒：
- 先商讨，后开发
- 由于交流操作的问题，其他人可能会慢一步响应，请谅解他们
- 如果你要和其他开发人员协作，请提前商议好接口
- 不要直接进行构建操作，构建由build_specialist负责
- 界面样式问题与frontend_dev_1协调
- 任务进度及时向project_manager汇报`,
                availableTools: [
                    'utils:create_file_entity',
                    'utils:read_file_lines',
                    'utils:edit_file_lines',
                    'utils:get_file_entity',
                    'utils:search_in_files',
                    'utils:get_global_entity',
                    'utils:send_message',
                    'utils:broadcast_message',
                    'utils:wait_for_some_time',
                    'utils:leave_world'
                ]
            },
            {
                agentId: 'build_specialist',
                role: '构建专员',
                initialMessage: '我是构建专员，负责将开发完成的项目构建为可执行的桌面应用。请项目经理在需要构建时通知我。在没有收到项目经理指示的情况下，我需要用 wait_for_some_time 操作等待一段时间。',
                roleDefinition: `你是构建专员，专门负责应用构建和发布。

团队成员：
- project_manager: 项目经理，发起构建请求
- frontend_dev_1: 前端开发人员1，提供代码
- frontend_dev_2: 前端开发人员2，提供代码

注意：不能猜测实体ID，必须向开发人员获取

核心职责：
1. 接收项目经理的构建指令
2. 验证项目结构的完整性
3. 执行Niva应用构建流程
4. 返回构建结果和可执行文件
5. 记录构建版本和变更
6. 当项目经理明确说明任务结束，允许离开后，方可退出世界

相关文档：

${buildDoc}

构建流程：
你会收到一些源代码文件实体，你需要：
1. 编写niva.json（重要：任何图标固定填写"assets/icon.png"，构建操作会自动处理并生成图标资源，你不需要手动创建），然后你需要创建项目目录
2. 对项目目录实体进行构建操作
3. 生成构建结果实体

重要规范：
- 只接受project_manager的构建请求
- 构建前确认项目结构完整
- 构建失败时提供详细错误信息
- 不参与代码开发，专注构建流程
- 你需要交付：可执行文件的路径，可执行文件的eid，项目目录的路径

沟通要求：
- 构建请求必须来自project_manager
- 由于交流操作的问题，其他人可能会慢一步响应，请谅解他们
- 构建完成后通知整个团队
- 构建问题及时反馈给项目经理`,
                availableTools: [
                    'utils:build_niva_app',
                    'utils:get_global_entity',
                    'utils:list_directory',
                    'utils:get_file_entity',
                    'utils:send_message',
                    'utils:broadcast_message',
                    'utils:wait_for_some_time',
                    'utils:create_file_entity',
                    'utils:read_file_lines',
                    'utils:edit_file_lines',
                    'utils:create_directory_entity',
                    'utils:search_in_files',
                    'utils:leave_world'
                ]
            }
        ];

        const agents = await createAgentSystems(agentConfigs);

        console.log('=== 软件协同开发团队启动 ===');
        console.log('项目目标：基于Niva框架开发桌面应用');
        console.log(`团队规模: ${agents.length} 名成员`);
        agents.forEach(agent => {
            console.log(`- ${agent.agentId} (${agent.role})`);
        });
        console.log('\n团队分工:');
        console.log('1. 项目经理: 任务分配、进度协调');
        console.log('2. 前端开发1: 界面布局、基础组件');
        console.log('3. 前端开发2: 功能逻辑、复杂组件');
        console.log('4. 构建专员: 应用构建、版本发布');
        console.log('\n协作规则:');
        console.log('- 开发人员并行开发不同页面');
        console.log('- 构建操作由专员统一执行');
        console.log('- 任务完成可申请退出');

        // 启动所有Agent
        for (const agent of agents) {
            agent.start().then(result => {
                console.log(`[完成] ${agent.agentId} 结束任务`);
                collaborationRecords.push({
                    type: 'completion',
                    agentId: agent.agentId,
                    result: result,
                    timestamp: new Date()
                });

                // 检查是否所有开发人员都已完成
                const activeAgents = agents.filter(a => !a.completed);
                if (activeAgents.length === 1 && activeAgents[0].agentId === 'project_manager') {
                    console.log('\n=== 项目开发完成 ===');
                    console.log('所有开发任务已完成，项目经理可以结束项目');
                }

            }).catch(error => {
                console.error(`[错误] ${agent.agentId}:`, error);
            });
        }

        // 项目进度监控
        setInterval(() => {
            const worldState = sharedWorld.getWorldState();

            // 分析开发进度指标
            const developmentMetrics = analyzeDevelopmentProgress(collaborationRecords, worldState);

            collaborationRecords.push({
                type: 'project_snapshot',
                worldState: worldState,
                metrics: developmentMetrics,
                timestamp: new Date()
            });

            console.log('\n=== 项目进展快照 ===');
            console.log(`代码文件: ${developmentMetrics.codeFiles}`);
            console.log(`目录结构: ${developmentMetrics.directories}`);
            console.log(`团队消息: ${developmentMetrics.teamMessages}`);
            console.log(`构建次数: ${developmentMetrics.buildCount}`);
            console.log(`活跃成员: ${developmentMetrics.activeMembers}`);

            // 保存项目记录
            fs.writeFileSync('software_development_project.json', JSON.stringify({
                project: 'Niva桌面应用开发',
                startTime: new Date().toISOString(),
                team: agentConfigs.map(config => ({ agentId: config.agentId, role: config.role })),
                records: collaborationRecords,
                metrics: developmentMetrics
            }, null, 2));

        }, 20000); // 每20秒记录一次

    } catch (error) {
        console.error('初始化开发团队时出错:', error);
    }
}

// 分析开发进度指标
function analyzeDevelopmentProgress(records, worldState) {
    const teamMessages = records.filter(r => r.type === 'agent' && r.response).length;

    // 统计代码文件
    let codeFiles = 0;
    let directories = 0;
    let buildCount = 0;

    if (worldState.entities) {
        Object.values(worldState.entities).forEach(entity => {
            if (entity.type === 'file' &&
                ['js', 'html', 'css', 'json'].includes(entity.data.fileType)) {
                codeFiles++;
            } else if (entity.type === 'directory') {
                directories++;
            } else if (entity.type === 'executable') {
                buildCount++;
            }
        });
    }

    // 统计活跃成员（简单实现）
    const recentMessages = records.filter(r =>
        r.type === 'agent' &&
        r.timeStamp &&
        new Date() - new Date(r.timeStamp) < 60000 // 1分钟内
    );
    const activeMembers = new Set(recentMessages.map(r => r.agentId)).size;

    return {
        codeFiles,
        directories,
        teamMessages,
        buildCount,
        activeMembers,
        timestamp: new Date().toISOString()
    };
}

main();

module.exports = {
    createAgentSystems,
    sharedWorld,
}
