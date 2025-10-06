// server/index.js
const express = require('express');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors()); // Allow frontend to call this server

const DB_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DB_URL });

const EMBED_SERVICE = process.env.EMBED_SERVICE_URL || 'http://127.0.0.1:8700/embed';
const LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'http://127.0.0.1:11434/api/generate';
const LLM_MODEL = process.env.LLM_MODEL || 'tiny-model';

app.post('/api/copilot', async (req, res) => {
  const { question, community_id, k = 6 } = req.body;

  try {
    // 1) Embed query
    const embedRes = await fetch(EMBED_SERVICE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [question] })
    });
    if (!embedRes.ok) throw new Error(`Embedding service failed: ${embedRes.statusText}`);
    const { embeddings } = await embedRes.json();
    const qEmbedding = embeddings[0];

    // 2) Vector search
    const client = await pool.connect();
    let docs = [];
    try {
      const sql = `
        SELECT id, title, content, source, metadata,
               embedding <#> $1 AS distance
        FROM ai_documents
        WHERE ($2::uuid IS NULL OR community_id = $2)
        ORDER BY embedding <#> $1
        LIMIT $3;
      `;
      const dbRes = await client.query(sql, [JSON.stringify(qEmbedding), community_id || null, k]);
      docs = dbRes.rows;
    } finally {
      client.release();
    }

    // 3) Assemble prompt
    const ctx = docs.map(d => `---
source: ${d.source}
${d.content.slice(0, 3000)}`).join("\n\n");
    const system = `You are SILAS Mind, a civic and pastoral assistant for Stoneclough. Use ONLY the provided context. Answer concisely, provide 1-3 actionable next steps, and cite sources in square brackets like [source: filename or supabase:stories/123]. If context is insufficient, say you don't have enough local info and propose a quick map mission to gather it.`;
    const userPrompt = `CONTEXT:
${ctx}

QUESTION:
${question}

REPLY:
`;

    // 4) Call local LLM endpoint and stream response
    const llmRes = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt: `${system}\n\n${userPrompt}`,
        stream: true
      })
    });

    if (llmRes.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      llmRes.body.pipe(res);
    } else {
      const text = await llmRes.text();
      res.json({ answer: text, sources: docs.map(d => d.source) });
    }

  } catch (error) {
    console.error('Error in copilot API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`SILAS Copilot server listening on port ${port}`);
});
