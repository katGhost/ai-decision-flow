'use client'

import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background
 } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';
import DecisionNode from '@/components/nodes/DecisionNode';
import StartNode from '@/components/nodes/StartNode';
import { v4 as uuid4 } from 'uuid';


const initialNodes = [];
const initialEdges = [];

// Node types
const nodeTypes = {
  decision: DecisionNode,
  start: StartNode,
}


export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection) => {
      const edge = {
        ...connection,
        label: connection.sourceHandle === 'yes' ? 'YES' : 'NO',
        style: {
          stroke: connection.sourceHandle === 'yes' ? '#22c55e' : '#ef4444'
        }
      };
      setEdges((current) => addEdge(edge, current));
    },
    [setEdges]
  );
 

  // Create start node handler function
  const handleCreateStartNode = () => {
    const newNode = {
      id: `start-${uuid4()}`,
      type: 'start',
      position: { x: 250, y: 25 },
      data: { label: `Start Node ${nodes.length + 1}` },
    };
    setNodes((current) => [...current, newNode]);
  };
  
  const updateNodePrompt = useCallback((id, prompt) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, prompt } } : node
      )
    )
  }, [setNodes])

  // Create decision node handler function
  const handleCreateDecisionNode = () => {
    const id = `decision-${uuid4()}`;
    const newNode = {
      id,
      type: 'decision',
      position: { x: 250, y: 100 },
      data: { 
        prompt: '', 
        onChange: (val) => updateNodePrompt(id, val) 
      },
    };
    setNodes((current) => [...current, newNode]);
  };

  
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 font-sans">
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-6 lg:p-8">
        {/* Canvas for React Flow */}
        <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:min-h-[600px]">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h1 className="text-lg font-semibold text-zinc-900">
              Canvas
            </h1>
            <span className="text-sm text-zinc-500">
              Flow editor
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
              <ReactFlow className="h-full w-full"
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
              >
                <Controls />
                <Background />
              </ReactFlow>
          </div>
        </section>

        {/* Sidebar -> to the right */}
        <aside className="flex w-full flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:w-80 lg:shrink-0">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Flow Builder
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Configure your workflow
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-medium text-zinc-800">
                Nodes
              </h3>
              <div className="flex mt-1 flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer"
                  onClick={handleCreateStartNode}
                >Add Start Node</button>
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer"
                  onClick={handleCreateDecisionNode}
                >
                  Add Decision Node
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-medium text-zinc-800">
                Properties
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Select a node to configure its properties.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}