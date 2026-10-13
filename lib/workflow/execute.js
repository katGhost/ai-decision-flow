import OpenAI from 'openai';

export default async function executeWorkflow({ nodes, edges, startId }) {
  const currentNode = nodes.find((node) => node.id === startId);

  if (!currentNode) {
    throw new Error(`Start node with id ${startId} not found`);
  }

  /*
    Find a node by id — nodes.find()
    Find the next edge — edges.find() matching source and label
    An OpenAI client pointed at OpenRouter
    A traverse loop
    An execution log array that records each step
  */
  const nextEdge = edges.find((edge) => edge.source === currentNode.id && edge.label === 'YES');

  // OpenAI client
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  // Traverse loop and exceution array log
  const executionLog = [];
  let nextNodeId = startNode.id;

  while (nextNodeId) {
    const node = nodes.find((n) => n.id === nextNodeId);
    if (!node) break;

    const response = await client.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: 'You are a decision engine. Respond with only YES or NO. No explanation.' },
        { role: 'user', content: node.data.prompt }
      ],
    });

    const answer = response.choices[0].message.content.trim().toUpperCase();

    executionLog.push({ nodeId: node.id, prompt: node.data.prompt, answer });

    const nextEdge = edges.find((edge) => edge.source === node.id && edge.label === answer);
    nextNodeId = nextEdge ? nextEdge.target : null;
  }

  return executionLog;

}