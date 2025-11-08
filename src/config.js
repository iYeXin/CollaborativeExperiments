const openaiConfig = {
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API || 'YOUR_API_KEY',
    model: 'deepseek-chat',
    temperature: 0.5
}

module.exports = {
    openaiConfig
}