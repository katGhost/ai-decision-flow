import OpenAI from 'openai';
import { inngest } from './client';
import { setRunResult } from '../workflow/store';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const runWorkflow = inngest.createFunction(
  { id: 'run-workflow', triggers: { event: 'workflow/run' } },
  async ({ event, step }) => {
    const { nodes, edges, startId } = event.data;

    const executionLog = [];
    let nextNodeId = startId;

    while (nextNodeId) {
      const node = nodes.find((n) => n.id === nextNodeId);
      if (!node) break;

      let answer = 'YES'; // Start Node just moves forward

      if (node.type === 'decision') {
        // check for an empty prompt, if prompt == empty { Do not run decision flow }
        if (!node.data.prompt) {
          executionLog.push({ nodeId: node.id, prompt: node.data.prompt, answer: 'NO PROMPT' });
          nextNodeId = null;
          continue;
        }

        answer = await step.run(`evaluate-${node.id}`, async () => {
          const response = await client.chat.completions.create({
            model: 'mistralai/ministral-3b-2512',
            messages: [
              { role: 'system', content: 'You are a decision engine. Respond with only YES or NO. No explanation.' },
              { role: 'user', content: node.data.prompt }
            ],
          });

          return response.choices[0].message.content.trim().toUpperCase();
        });

        executionLog.push({ nodeId: node.id, prompt: node.data.prompt, answer });
      }

      let nextEdge;

      if (node.type === 'start') {
        // Only one outgoing edge, no label to match
        nextEdge = edges.find((edge) => edge.source === node.id);
      } else {
        // Decision node — match the edge whose label equals the LLM's answer
        nextEdge = edges.find((edge) => edge.source === node.id && edge.label === answer);
      }

      nextNodeId = nextEdge ? nextEdge.target : null;
    }

    setRunResult(event.id, executionLog);
    console.log('STORE WRITE:', event.id, executionLog.length);
    return executionLog;
  }
);