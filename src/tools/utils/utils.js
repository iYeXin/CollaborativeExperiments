const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const os = require('os');
// 上下文/记忆   // 学习    // thoughts预览    // 现实映射
class UtilsToolkit {
    constructor(config) {
        this.fileEntities = config.initialFileEntities || [];
        this.directoryEntities = config.initialDirectoryEntities || [];
        this.sharedWorld = config.sharedWorld || null;

        // 构建配置
        this.buildConfig = {
            nivaDevToolsPath: config.nivaDevToolsPath || 'niva.exe',
            tempDirPrefix: 'niva-build-'
        };
    }

    async execute(toolName, parameters, ctx) {
        switch (toolName) {
            case "create_file_entity":
                return await this.createFileEntity(parameters, ctx);
            case "read_file_lines":
                return await this.readFileLines(parameters, ctx);
            case "edit_file_lines":
                return await this.editFileLines(parameters, ctx);
            case "create_directory_entity":
                return await this.createDirectoryEntity(parameters, ctx);
            case "list_directory":
                return await this.listDirectory(parameters, ctx);
            case "build_niva_app":
                return await this.buildNivaApp(parameters, ctx);
            case "get_file_entity":
                return await this.getFileEntity(parameters, ctx);
            case "search_in_files":
                return await this.searchInFiles(parameters, ctx);
            case "create_global_entity":
                return await this.createGlobalEntity(parameters, ctx);
            case "get_global_entity":
                return await this.getGlobalEntity(parameters, ctx);
            case "send_message":
                return await this.sendMessage(parameters, ctx);
            case "broadcast_message":
                return await this.broadcastMessage(parameters, ctx);
            case "wait_for_some_time":
                return await this.waitSomeTime(parameters, ctx);
            default:
                return {
                    op_result: "error",
                    error: `未知的工具: ${toolName}`
                };
        }
    }

    async createFileEntity(parameters, ctx) {
        const { fileName, content, fileType, description, makeGlobal = true, expectedEID } = parameters;

        // 验证文件名
        if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            return {
                op_result: "error",
                error: "文件名不能包含路径分隔符或相对路径符号"
            };
        }

        // 检查文件名是否已存在
        let finalFileName = fileName;
        if (this.fileEntities.find(fileEntity => fileEntity.data.name === fileName)) {
            finalFileName = `${path.parse(fileName).name}_${Date.now().toString().slice(-4)}${path.extname(fileName)}`;
        }

        let eid = ''

        if (!expectedEID) eid = `file_${finalFileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

        const fileEntity = {
            eid: `${expectedEID || eid}`,
            type: "file",
            data: {
                name: finalFileName,
                content: content,
                fileType: fileType || path.extname(finalFileName).slice(1),
                description: description || `代码文件: ${finalFileName}`,
                createdBy: ctx.agentId,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                lineCount: content.split('\n').length
            }
        };

        this.fileEntities.push(fileEntity);

        const result = {
            op_result: "success",
            world_resp: {
                message: `文件实体创建成功: ${finalFileName}`,
                fileEntity: fileEntity
            }
        };

        // 注册为全局实体
        if (this.sharedWorld && makeGlobal) {
            const globalEntityId = this.sharedWorld.registerEntity({
                ...fileEntity,
                isGlobal: true
            });
            result.global_entity_id = globalEntityId;
        }

        return result;
    }

    async readFileLines(parameters, ctx) {
        const { fileEntityId, startLine = 1, endLine } = parameters;

        // 查找文件实体
        let fileEntity = this.fileEntities.find(entity => entity.eid === fileEntityId);
        if (!fileEntity && this.sharedWorld) {
            fileEntity = this.sharedWorld.getEntity(fileEntityId);
        }

        if (!fileEntity || fileEntity.type !== "file") {
            return {
                op_result: "error",
                error: `未找到文件实体: ${fileEntityId}`
            };
        }

        const content = fileEntity.data.content;
        const lines = content.split('\n');
        const totalLines = lines.length;

        // 验证行号范围
        const start = Math.max(1, Math.min(startLine, totalLines));
        const end = endLine ? Math.min(endLine, totalLines) : totalLines;

        if (start > end) {
            return {
                op_result: "error",
                error: "起始行号不能大于结束行号"
            };
        }

        // 构建行号显示格式
        const lineDisplay = [];
        for (let i = start - 1; i < end; i++) {
            lineDisplay.push({
                lineNumber: i + 1,
                content: lines[i]
            });
        }

        return {
            op_result: "success",
            world_resp: {
                fileName: fileEntity.data.name,
                totalLines: totalLines,
                displayRange: `${start}-${end}`,
                lines: lineDisplay,
                fileInfo: {
                    fileType: fileEntity.data.fileType,
                    createdBy: fileEntity.data.createdBy,
                    lastModified: fileEntity.data.lastModified
                }
            }
        };
    }

    async editFileLines(parameters, ctx) {
        const { fileEntityId, lineEdits } = parameters;

        // 查找文件实体
        let fileEntity = this.fileEntities.find(entity => entity.eid === fileEntityId);
        let entitySource = 'local';

        if (!fileEntity && this.sharedWorld) {
            fileEntity = this.sharedWorld.getEntity(fileEntityId);
            entitySource = 'shared';
        }

        if (!fileEntity || fileEntity.type !== "file") {
            return {
                op_result: "error",
                error: `未找到文件实体: ${fileEntityId}`
            };
        }

        const lines = fileEntity.data.content.split('\n');
        const totalLines = lines.length;

        // 应用编辑操作
        const operations = [];
        let newLines = [...lines];

        for (const edit of lineEdits) {
            const { lineNumber, action, content } = edit;

            if (lineNumber < 1 || (action !== 'insert' && lineNumber > totalLines)) {
                operations.push({
                    lineNumber,
                    action,
                    status: 'failed',
                    error: '行号超出范围'
                });
                continue;
            }

            try {
                switch (action) {
                    case 'insert':
                        // 在指定行前插入
                        newLines.splice(lineNumber - 1, 0, content);
                        operations.push({
                            lineNumber,
                            action,
                            status: 'success',
                            message: `在第${lineNumber}行前插入新行`
                        });
                        break;

                    case 'update':
                        // 更新指定行
                        newLines[lineNumber - 1] = content;
                        operations.push({
                            lineNumber,
                            action,
                            status: 'success',
                            message: `更新第${lineNumber}行`,
                            oldContent: lines[lineNumber - 1],
                            newContent: content
                        });
                        break;

                    case 'delete':
                        // 删除指定行
                        const deletedContent = newLines.splice(lineNumber - 1, 1)[0];
                        operations.push({
                            lineNumber,
                            action,
                            status: 'success',
                            message: `删除第${lineNumber}行`,
                            deletedContent: deletedContent
                        });
                        break;

                    default:
                        operations.push({
                            lineNumber,
                            action,
                            status: 'failed',
                            error: `未知的操作类型: ${action}`
                        });
                }
            } catch (error) {
                operations.push({
                    lineNumber,
                    action,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        // 更新文件内容
        fileEntity.data.content = newLines.join('\n');
        fileEntity.data.lastModified = new Date().toISOString();
        fileEntity.data.lineCount = newLines.length;
        fileEntity.data.lastEditedBy = ctx.agentId;

        // 更新共享世界
        if (entitySource === 'shared' && this.sharedWorld) {
            this.sharedWorld.updateEntity(fileEntityId, fileEntity);
        }

        return {
            op_result: "success",
            world_resp: {
                message: `文件编辑完成，共执行 ${operations.filter(op => op.status === 'success').length} 个操作`,
                fileName: fileEntity.data.name,
                newLineCount: newLines.length,
                operations: operations,
                fileInfo: {
                    lastModified: fileEntity.data.lastModified,
                    lastEditedBy: fileEntity.data.lastEditedBy
                }
            }
        };
    }

    async createDirectoryEntity(parameters, ctx) {
        const { directoryName, structure, description, makeGlobal = true } = parameters;

        // 验证目录结构
        const validationResult = await this._validateDirectoryStructure(structure);
        if (!validationResult.valid) {
            return {
                op_result: "error",
                error: `目录结构验证失败: ${validationResult.error}`
            };
        }

        const directoryEntity = {
            eid: `dir_${directoryName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            type: "directory",
            data: {
                name: directoryName,
                structure: structure,
                description: description || `项目目录: ${directoryName}`,
                createdBy: ctx.agentId,
                createdAt: new Date().toISOString(),
                itemCount: this._countDirectoryItems(structure)
            }
        };

        this.directoryEntities.push(directoryEntity);

        const result = {
            op_result: "success",
            world_resp: {
                message: `目录实体创建成功: ${directoryName}`,
                directoryEntity: directoryEntity
            }
        };

        // 注册为全局实体
        if (this.sharedWorld && makeGlobal) {
            const globalEntityId = this.sharedWorld.registerEntity({
                ...directoryEntity,
                isGlobal: true
            });
            result.global_entity_id = globalEntityId;
        }

        return result;
    }

    async listDirectory(parameters, ctx) {
        const { directoryEntityId } = parameters;

        // 查找目录实体
        let directoryEntity = this.directoryEntities.find(entity => entity.eid === directoryEntityId);
        if (!directoryEntity && this.sharedWorld) {
            directoryEntity = this.sharedWorld.getEntity(directoryEntityId);
        }

        if (!directoryEntity || directoryEntity.type !== "directory") {
            return {
                op_result: "error",
                error: `未找到目录实体: ${directoryEntityId}`
            };
        }

        const listing = await this._generateDirectoryListing(directoryEntity.data.structure);

        return {
            op_result: "success",
            world_resp: {
                directoryName: directoryEntity.data.name,
                description: directoryEntity.data.description,
                totalItems: directoryEntity.data.itemCount,
                createdBy: directoryEntity.data.createdBy,
                contents: listing
            }
        };
    }

    async buildNivaApp(parameters, ctx) {
        const { directoryEntityId, buildName, description } = parameters;

        // 查找目录实体
        let directoryEntity = this.directoryEntities.find(entity => entity.eid === directoryEntityId);
        if (!directoryEntity && this.sharedWorld) {
            directoryEntity = this.sharedWorld.getEntity(directoryEntityId);
        }

        if (!directoryEntity || directoryEntity.type !== "directory") {
            return {
                op_result: "error",
                error: `未找到目录实体: ${directoryEntityId}`
            };
        }

        try {
            // 1. 创建临时目录
            const tempDir = await this._createTempDirectory();

            // 2. 将虚拟目录结构写入临时文件系统
            await this._writeDirectoryToFilesystem(directoryEntity.data.structure, tempDir);

            // 3. 复制utils/lib目录到临时目录
            await this._copyLibDirectory(tempDir);

            // 4. 复制utils/assets目录到临时目录
            await this._copyAssetsDirectory(tempDir);

            // 5. 验证项目结构（必须包含niva.json）
            const nivaConfigPath = path.join(tempDir, 'niva.json');
            if (!fs.existsSync(nivaConfigPath)) {
                throw new Error('项目目录中必须包含niva.json配置文件');
            }

            // 6. 执行构建（使用新的不依赖命令行返回的方法）
            const { exeBuffer, exePath } = await this._executeNivaBuildWithTimeout(tempDir, buildName);

            // 7. 清理临时目录
            // await this._cleanupTempDirectory(tempDir);

            // 8. 创建可执行文件实体
            const exeEntity = {
                eid: `exe_${buildName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
                type: "executable",
                data: {
                    name: `${buildName}.exe`,
                    buildName: buildName,
                    description: description || `Niva应用构建: ${buildName}`,
                    builtFrom: directoryEntityId,
                    builtBy: ctx.agentId,
                    buildTime: new Date().toISOString(),
                    fileSize: exeBuffer.length,
                    path: exePath,
                }
            };

            this.fileEntities.push(exeEntity);

            const result = {
                op_result: "success",
                world_resp: {
                    message: `应用构建成功: ${buildName}`,
                    executableEntity: {
                        eid: exeEntity.eid,
                        name: exeEntity.data.name,
                        buildName: exeEntity.data.buildName,
                        fileSize: exeEntity.data.fileSize,
                        buildTime: exeEntity.data.buildTime,
                        path: exeEntity.data.path
                    },
                    buildInfo: {
                        sourceDirectory: directoryEntity.data.name,
                        builtBy: ctx.agentId,
                        projectPath: tempDir
                    }
                }
            };

            // 注册为全局实体
            if (this.sharedWorld) {
                const globalEntityId = this.sharedWorld.registerEntity({
                    ...exeEntity,
                    isGlobal: true
                });
                result.global_entity_id = globalEntityId;
            }

            return result;

        } catch (error) {
            return {
                op_result: "error",
                error: `构建失败: ${error.message}`
            };
        }
    }

    async getFileEntity(parameters, ctx) {
        const { fileEntityId } = parameters;

        // 查找文件实体
        let fileEntity = this.fileEntities.find(entity => entity.eid === fileEntityId);
        if (!fileEntity && this.sharedWorld) {
            fileEntity = this.sharedWorld.getEntity(fileEntityId);
        }

        if (!fileEntity || fileEntity.type !== "file") {
            return {
                op_result: "error",
                error: `未找到文件实体: ${fileEntityId}`
            };
        }

        return {
            op_result: "success",
            world_resp: fileEntity
        };
    }

    async searchInFiles(parameters, ctx) {
        const { fileEntityIds, searchText, caseSensitive = false } = parameters;

        const results = [];

        for (const fileEntityId of fileEntityIds) {
            // 查找文件实体
            let fileEntity = this.fileEntities.find(entity => entity.eid === fileEntityId);
            if (!fileEntity && this.sharedWorld) {
                fileEntity = this.sharedWorld.getEntity(fileEntityId);
            }

            if (!fileEntity || fileEntity.type !== "file") {
                continue;
            }

            const content = fileEntity.data.content;
            const lines = content.split('\n');
            const matches = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                let searchInLine = line;
                let searchTextToUse = searchText;

                if (!caseSensitive) {
                    searchInLine = line.toLowerCase();
                    searchTextToUse = searchText.toLowerCase();
                }

                if (searchInLine.includes(searchTextToUse)) {
                    matches.push({
                        lineNumber: i + 1,
                        content: line,
                        matchPositions: this._findAllOccurrences(line, searchText, caseSensitive)
                    });
                }
            }

            if (matches.length > 0) {
                results.push({
                    fileEntityId: fileEntityId,
                    fileName: fileEntity.data.name,
                    fileType: fileEntity.data.fileType,
                    matches: matches,
                    totalMatches: matches.length
                });
            }
        }

        return {
            op_result: "success",
            world_resp: {
                searchText: searchText,
                caseSensitive: caseSensitive,
                searchedFiles: fileEntityIds.length,
                filesWithMatches: results.length,
                totalMatches: results.reduce((sum, result) => sum + result.totalMatches, 0),
                results: results
            }
        };
    }

    // 基础工具方法（保持不变）
    async createGlobalEntity(parameters, ctx) {
        if (!this.sharedWorld) {
            return {
                op_result: "error",
                error: "共享世界不可用"
            };
        }

        const { entityData, description } = parameters;
        const entityId = this.sharedWorld.registerEntity({
            ...entityData,
            createdBy: ctx.agentId,
            description: description
        });

        return {
            op_result: "success",
            world_resp: {
                eid: entityId,
                type: "global_entity",
                message: `全局实体已创建: ${entityId}`
            }
        };
    }

    async getGlobalEntity(parameters, ctx) {
        if (!this.sharedWorld) {
            return {
                op_result: "error",
                error: "共享世界不可用"
            };
        }

        const { entityId } = parameters;
        const entity = this.sharedWorld.getEntity(entityId);

        if (entity) {
            return {
                op_result: "success",
                world_resp: entity
            };
        } else {
            return {
                op_result: "error",
                error: `未找到实体: ${entityId}`
            };
        }
    }

    async sendMessage(parameters, ctx) {
        if (!this.sharedWorld) {
            return {
                op_result: "error",
                error: "共享世界不可用"
            };
        }

        const { toAgentId, content } = parameters;
        this.sharedWorld.sendMessage(toAgentId, {
            content,
            from: ctx.agentId,
            type: 'agent_message',
            timestamp: new Date().toISOString()
        });

        return {
            op_result: "success",
            world_resp: {
                message: `消息已发送给开发人员 ${toAgentId}`,
                content: content
            }
        };
    }

    async broadcastMessage(parameters, ctx) {
        if (!this.sharedWorld) {
            return {
                op_result: "error",
                error: "共享世界不可用"
            };
        }

        const { content } = parameters;
        this.sharedWorld.broadcastMessage({
            content,
            from: ctx.agentId,
            type: 'broadcast_message',
            timestamp: new Date().toISOString()
        }, ctx.agentId);

        return {
            op_result: "success",
            world_resp: {
                message: "消息已广播给所有开发人员",
                content: content
            }
        };
    }

    async waitSomeTime(parameters = { time: 10 }, ctx) {
        const { time } = parameters;
        const waitTime = Math.min(time, 30); // 最大等待30秒
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return {
            op_result: "success",
            world_resp: {
                message: `等待 ${waitTime} 秒完成`,
                waitedSeconds: waitTime
            }
        };
    }

    // 私有辅助方法
    async _validateDirectoryStructure(structure) {
        const validateNode = (node, path = '') => {
            if (typeof node === 'string') {
                // 应该是文件实体ID
                if (!node.startsWith('file_') && !node.startsWith('ent_')) {
                    return { valid: false, error: `路径 ${path}: 期望文件实体ID，但得到 ${node}` };
                }
                return { valid: true };
            } else if (typeof node === 'object') {
                // 应该是子目录
                for (const [key, value] of Object.entries(node)) {
                    const result = validateNode(value, path ? `${path}/${key}` : key);
                    if (!result.valid) return result;
                }
                return { valid: true };
            } else {
                return { valid: false, error: `路径 ${path}: 无效的节点类型` };
            }
        };

        return validateNode(structure);
    }

    _countDirectoryItems(structure) {
        let count = 0;

        const countNode = (node) => {
            if (typeof node === 'string') {
                count++;
            } else if (typeof node === 'object') {
                for (const value of Object.values(node)) {
                    countNode(value);
                }
            }
        };

        countNode(structure);
        return count;
    }

    async _generateDirectoryListing(structure, currentPath = '') {
        const listing = [];

        for (const [name, value] of Object.entries(structure)) {
            const fullPath = currentPath ? `${currentPath}/${name}` : name;

            if (typeof value === 'string') {
                // 文件
                let fileEntity = this.fileEntities.find(entity => entity.eid === value);
                if (!fileEntity && this.sharedWorld) {
                    fileEntity = this.sharedWorld.getEntity(value);
                }

                if (fileEntity) {
                    listing.push({
                        name: name,
                        type: 'file',
                        path: fullPath,
                        entityId: value,
                        fileType: fileEntity.data.fileType,
                        size: fileEntity.data.content.length,
                        created: fileEntity.data.createdAt,
                        lastModified: fileEntity.data.lastModified
                    });
                }
            } else if (typeof value === 'object') {
                // 目录
                const subItems = await this._generateDirectoryListing(value, fullPath);
                listing.push({
                    name: name,
                    type: 'directory',
                    path: fullPath,
                    itemCount: subItems.length,
                    items: subItems
                });
            }
        }

        return listing;
    }

    // 新增的辅助方法
    async _copyLibDirectory(tempDir) {
        try {
            const libSourcePath = path.join(__dirname, 'lib');
            const libTargetPath = path.join(tempDir, 'lib');

            if (fs.existsSync(libSourcePath)) {
                await this._copyDirectoryRecursive(libSourcePath, libTargetPath);
                console.log(`已复制lib目录到: ${libTargetPath}`);
            } else {
                console.warn(`lib目录不存在: ${libSourcePath}`);
            }
        } catch (error) {
            console.warn(`复制lib目录失败: ${error.message}`);
        }
    }

    async _copyAssetsDirectory(tempDir) {
        try {
            const assetsSourcePath = path.join(__dirname, 'assets');
            const assetsTargetPath = path.join(tempDir, 'assets');

            if (fs.existsSync(assetsSourcePath)) {
                await this._copyDirectoryRecursive(assetsSourcePath, assetsTargetPath);
                console.log(`已复制assets目录到: ${assetsTargetPath}`);
            } else {
                console.warn(`assets目录不存在: ${assetsSourcePath}`);
            }
        } catch (error) {
            console.warn(`复制assets目录失败: ${error.message}`);
        }
    }

    async _copyDirectoryRecursive(source, target) {
        // 创建目标目录
        fs.mkdirSync(target, { recursive: true });

        // 读取源目录内容
        const items = fs.readdirSync(source);

        for (const item of items) {
            const sourcePath = path.join(source, item);
            const targetPath = path.join(target, item);

            const stat = fs.statSync(sourcePath);

            if (stat.isDirectory()) {
                // 递归复制子目录
                await this._copyDirectoryRecursive(sourcePath, targetPath);
            } else {
                // 复制文件
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    async _executeNivaBuildWithTimeout(projectDir, buildName) {
        return new Promise(async (resolve, reject) => {
            const outputPath = path.join(os.tmpdir(), `niva-app-${Date.now()}.exe`);
            const expectedExePath = path.join(os.tmpdir(), `${buildName}.exe`);

            // 使用 exec 启动构建进程，但不等待回调
            const command = `"${__dirname}/${this.buildConfig.nivaDevToolsPath}" --action=build --project="${projectDir}" --output="${outputPath}"`;

            console.log(`执行构建命令: ${command}`);

            // 正常执行命令，不等待返回
            exec(command, (error, stdout, stderr) => {
                // 这个回调会在命令完成后被调用，但我们不依赖它
                if (error) {
                    console.warn(`构建命令执行出现错误: ${error.message}`);
                }
                if (stderr) {
                    console.warn(`构建警告: ${stderr}`);
                }
                if (stdout) {
                    console.log(`构建输出: ${stdout}`);
                }
            });

            console.log(`已启动Niva构建进程，项目目录: ${projectDir}`);
            console.log(`期望输出文件: ${expectedExePath}`);

            let buildSuccess = false;
            const startTime = Date.now();
            const timeout = this.buildConfig.buildTimeout;

            // 定时检查文件是否生成
            const checkInterval = setInterval(() => {
                // 检查多个可能的输出路径
                const possiblePaths = [
                    expectedExePath,
                    outputPath,
                    path.join(projectDir, `${buildName}.exe`),
                    path.join(projectDir, 'dist', `${buildName}.exe`)
                ];

                for (const exePath of possiblePaths) {
                    if (fs.existsSync(exePath)) {
                        clearInterval(checkInterval);
                        buildSuccess = true;
                        console.log(`构建成功！找到输出文件: ${exePath}`);

                        try {
                            const exeBuffer = fs.readFileSync(exePath);
                            // 清理输出文件
                            // fs.unlinkSync(exePath);
                            resolve({ exeBuffer, exePath });
                            return;
                        } catch (readError) {
                            reject(new Error(`读取构建输出失败: ${readError.message}`));
                            return;
                        }
                    }
                }

                // 检查超时
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`构建超时（${timeout}ms），未生成可执行文件`));
                }
            }, 1000); // 每秒检查一次

            // 初始检查
            const possiblePaths = [
                expectedExePath,
                outputPath,
                path.join(projectDir, `${buildName}.exe`),
                path.join(projectDir, 'dist', `${buildName}.exe`)
            ];

            for (const exePath of possiblePaths) {
                if (fs.existsSync(exePath)) {
                    clearInterval(checkInterval);
                    buildSuccess = true;
                    console.log(`构建成功！找到输出文件: ${exePath}`);

                    try {
                        const exeBuffer = fs.readFileSync(exePath);
                        // 清理输出文件
                        fs.unlinkSync(exePath);
                        resolve(exeBuffer);
                        return;
                    } catch (readError) {
                        reject(new Error(`读取构建输出失败: ${readError.message}`));
                        return;
                    }
                }
            }
        });
    }

    async _createTempDirectory() {
        const tempDir = path.join(os.tmpdir(), `${this.buildConfig.tempDirPrefix}${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        return tempDir;
    }

    async _writeDirectoryToFilesystem(structure, basePath, currentPath = '') {
        for (const [name, value] of Object.entries(structure)) {
            const fullPath = path.join(basePath, currentPath, name);

            if (typeof value === 'string') {
                // 文件
                let fileEntity = this.fileEntities.find(entity => entity.eid === value);
                if (!fileEntity && this.sharedWorld) {
                    fileEntity = this.sharedWorld.getEntity(value);
                }

                if (fileEntity) {
                    // 确保目录存在
                    const dirName = path.dirname(fullPath);
                    fs.mkdirSync(dirName, { recursive: true });

                    // 写入文件内容
                    fs.writeFileSync(fullPath, fileEntity.data.content);
                }
            } else if (typeof value === 'object') {
                // 目录
                fs.mkdirSync(fullPath, { recursive: true });
                await this._writeDirectoryToFilesystem(value, basePath, path.join(currentPath, name));
            }
        }
    }


    async _cleanupTempDirectory(tempDir) {
        try {
            const fs = require('fs').promises;
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn(`清理临时目录失败: ${error.message}`);
        }
    }

    _findAllOccurrences(text, searchText, caseSensitive) {
        const positions = [];
        let searchInText = text;
        let searchTextToUse = searchText;

        if (!caseSensitive) {
            searchInText = text.toLowerCase();
            searchTextToUse = searchText.toLowerCase();
        }

        let index = searchInText.indexOf(searchTextToUse);
        while (index !== -1) {
            positions.push({
                start: index,
                end: index + searchText.length
            });
            index = searchInText.indexOf(searchTextToUse, index + 1);
        }

        return positions;
    }
}

// 创建执行器函数
function createUtilsToolkit(config = {}) {
    const toolkit = new UtilsToolkit(config);
    return async (toolName, parameters, ctx) => {
        return await toolkit.execute(toolName, parameters, ctx);
    };
}

module.exports = createUtilsToolkit;
