import OpenAI from 'openai';
import { inngest } from './client';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const runWorkflow = inngest.createFunction(
  { id: 'run-wokrflow', triggers: { event: 'workflow/run' } },
  async ({ event, step }) => {
    const { nodes, edges, startId } = event.data;

    const executionLog = [];
    let nextNodeId = startId;

    while (nextNodeId) {
      const node = nodes.find((n) => n.id === nextNodeId);
      if (!node) break;

      const answer = await step.run(`evaluate-${node.id}`, async () => {
        const response = await client.chat.completions.create({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: 'You are a decision engine. Respond with only YES or NO. No explanation.' },
            { role: 'user', content: node.data.prompt }
          ],
        });
        return response.choices[0].message.content.trim().toUpperCase();
      });

      executionLog.push({ nodeId: node.id, prompt: node.data.prompt, answer });

      const nextEdge = edges.find((edge) => edge.source === node.id && edge.label === answer);
      nextNodeId = nextEdge ? nextEdge.target : null;
    }

    return executionLog;
  }
);