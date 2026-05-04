#!/usr/bin/env node
/**
 * DeepSeek Proxy — 让 Claude Code 通过 DeepSeek API 工作
 *
 * 启动: node deepseek-proxy.mjs
 * 默认端口 8080，通过 ANTHROPIC_BASE_URL=http://localhost:8080 让 Claude Code 调用
 *
 * Claude Code 用这个 proxy 的方式:
 *   ANTHROPIC_BASE_URL=http://localhost:8080 ANTHROPIC_API_KEY=sk-xxx claude ...
 *
 * 原理: Claude Code 发送 Anthropic Messages API 格式的请求，
 * 这个 proxy 将其转换为 OpenAI Chat Completions 格式发给 DeepSeek，
 * 再转回 Anthropic 格式返回给 Claude Code。
 */

import http from 'node:http';
import { spawn } from 'node:child_process';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const PORT = parseInt(process.env.PORT || '8080', 10);

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 需要设置 DEEPSEEK_API_KEY 环境变量');
  console.error('   export DEEPSEEK_API_KEY=sk-xxx');
  console.error('   或通过 ANTHROPIC_API_KEY 传入 (会被当作 DeepSeek key 使用)');
  process.exit(1);
}

console.log(`🚀 DeepSeek Proxy 启动在 http://localhost:${PORT}`);
console.log(`📦 模型: ${DEEPSEEK_MODEL}`);
console.log('');
console.log('使用方式:');
console.log(`  ANTHROPIC_BASE_URL=http://localhost:${PORT} ANTHROPIC_API_KEY=${DEEPSEEK_API_KEY.slice(0, 10)}... claude ...`);
console.log('');

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', provider: 'deepseek', model: DEEPSEEK_MODEL }));
    return;
  }

  // 只处理 messages 端点
  if (req.url === '/v1/messages') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const anthropicReq = JSON.parse(body);
        const result = await proxyToDeepSeek(anthropicReq, res);
        if (result) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      } catch (err) {
        console.error('❌ 解析请求失败:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    });
    return;
  }

  // 其他端点返回空响应（Claude Code 可能会调用 models 等）
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({}));
});

// 核心转换逻辑
async function proxyToDeepSeek(anthropicReq, res) {
  console.log(`\n📨 收到 Claude 请求: model=${anthropicReq.model}, messages=${anthropicReq.messages?.length || 0}`);

  // 提取 system prompt
  let systemMsg = '';
  const messages = [];
  for (const msg of (anthropicReq.messages || [])) {
    if (msg.role === 'system') {
      systemMsg += (msg.content || '') + '\n';
    } else {
      // 处理 content 可能是数组（包含 image 等）
      let textContent = '';
      if (typeof msg.content === 'string') {
        textContent = msg.content;
      } else if (Array.isArray(msg.content)) {
        textContent = msg.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
      }
      messages.push({ role: msg.role, content: textContent });
    }
  }

  // 组装 OpenAI 格式请求
  const openaiMessages = [];
  if (systemMsg.trim()) {
    openaiMessages.push({ role: 'system', content: systemMsg.trim() });
  }
  openaiMessages.push(...messages);

  const openaiReq = {
    model: DEEPSEEK_MODEL,
    messages: openaiMessages,
    max_tokens: anthropicReq.max_tokens || 4096,
    temperature: anthropicReq.temperature ?? 0.7,
    stream: anthropicReq.stream === true,
  };

  // 处理 tool_use / tool_result
  if (anthropicReq.tools && anthropicReq.tools.length > 0) {
    // DeepSeek 支持 function calling
    openaiReq.tools = anthropicReq.tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.input_schema || {},
      },
    }));
  }

  console.log(`🔄 转发到 DeepSeek: ${JSON.stringify(openaiReq).slice(0, 300)}...`);

  // 流式响应
  if (openaiReq.stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      const apiRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(openaiReq),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error('❌ DeepSeek API 错误:', apiRes.status, errText);
        res.write(`data: ${JSON.stringify({ type: 'error', error: { message: `DeepSeek API ${apiRes.status}: ${errText}` } })}\n\n`);
        res.end();
        return null;
      }

      const reader = apiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              const finishReason = chunk.choices?.[0]?.finish_reason;

              if (delta?.content) {
                // 转成 Anthropic SSE 格式
                res.write(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: delta.content } })}\n\n`);
              }

              // tool_calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  res.write(`data: ${JSON.stringify({
                    type: 'content_block_delta',
                    index: 0,
                    delta: {
                      type: 'tool_use_delta',
                      name: tc.function?.name || '',
                      partial_json: tc.function?.arguments || '',
                    },
                  })}\n\n`);
                }
              }

              if (finishReason) {
                res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              }
            } catch (e) {
              // skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ 流式请求失败:', err.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: { message: err.message } })}\n\n`);
    }
    res.end();
    return null;
  }

  // 非流式
  try {
    const apiRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(openaiReq),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('❌ DeepSeek API 错误:', apiRes.status, errText);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: `DeepSeek API ${apiRes.status}: ${errText}` } }));
      return null;
    }

    const data = await apiRes.json();
    const choice = data.choices?.[0];

    // 转成 Anthropic Messages API 格式
    const anthropicResp = {
      id: data.id || `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [],
      model: anthropicReq.model || 'deepseek-chat',
      stop_reason: choice?.finish_reason === 'stop' ? 'end_turn'
        : choice?.finish_reason === 'tool_calls' ? 'tool_use'
        : choice?.finish_reason === 'length' ? 'max_tokens'
        : null,
      usage: data.usage ? {
        input_tokens: data.usage.prompt_tokens || 0,
        output_tokens: data.usage.completion_tokens || 0,
      } : undefined,
    };

    // 添加文本内容
    if (choice?.message?.content) {
      anthropicResp.content.push({
        type: 'text',
        text: choice.message.content,
      });
    }

    // 添加 tool_calls
    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        let args = tc.function?.arguments || '{}';
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch (e) {}
        }
        anthropicResp.content.push({
          type: 'tool_use',
          id: tc.id || `toolu_${Date.now()}`,
          name: tc.function?.name || '',
          input: args,
        });
      }
    }

    console.log(`✅ DeepSeek 响应: tokens=${data.usage?.total_tokens || '?'}, finish=${choice?.finish_reason}`);
    return anthropicResp;
  } catch (err) {
    console.error('❌ 请求 DeepSeek 失败:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: err.message } }));
    return null;
  }
}

server.listen(PORT, () => {
  console.log(`✅ Proxy 运行中 http://localhost:${PORT}`);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 关闭 Proxy');
  process.exit(0);
});
process.on('SIGTERM', () => {
  process.exit(0);
});
