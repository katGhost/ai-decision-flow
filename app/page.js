'use client'

import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background
 } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useRef, useState } from 'react';
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


function attachNodeHandlers(nodes, updatePrompt) {
  return nodes.map((node) => {
    if (node.type === 'decision') {
      return {
        ...node,
        data: {
          ...node.data,
          onChange: (val) => updatePrompt(node.id, val),
        },
      };
    }
    return node;
  });
}

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);

  const pollIntervalRef = useRef(null);

  const onConnect = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const isFromStart = sourceNode?.type === 'start';

      const edge = {
        ...connection,
        ...(isFromStart
          ? {} // no label, no color — Start Node just connects forward
          : {
              label: connection.sourceHandle === 'yes' ? 'YES' : 'NO',
              style: {
                stroke: connection.sourceHandle === 'yes' ? '#22c55e' : '#ef4444',
              },
            }),
      };
      setEdges((current) => addEdge(edge, current));
    },
    [setEdges, nodes]
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

  // Save and load workflow
  useEffect(() => {
    const saved = localStorage.getItem('workflow');
    if (saved) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
      setNodes(attachNodeHandlers(savedNodes, updateNodePrompt));
      setEdges(savedEdges);
    }
  }, []);
  

  const handleSaveWorkflow = () => {
    localStorage.setItem('workflow', JSON.stringify({ nodes, edges }));
  }

  // Import and Export
  const handleExportWorkflow = () => {
    const exportWorkflow = JSON.stringify({ nodes, edges });

    // Create blob for data download
    const blob = new Blob([exportWorkflow], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'filename.json';
    link.click();
  }

  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const { nodes: importedNodes, edges: importedEdges } = JSON.parse(event.target.result);
      setNodes(attachNodeHandlers(importedNodes, updateNodePrompt));
      setEdges(importedEdges);
    };
    reader.readAsText(file);
  };

  // Execution logs panel 
  const startPolling = (eventId) => {
    pollIntervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/status?eventId=${eventId}`);
      const data = await res.json();

      if (data.status === 'Completed' || data.status === 'Failed') {
        clearInterval(pollIntervalRef.current);
        setExecutionLog(data.output || []);
        setIsRunning(false);
      }
    }, 1500);
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setExecutionLog([]);

    const startNodeId = nodes.find((node) => node.type === 'start')?.id;
    if (!startNodeId) {
      alert('Please add a Start Node before running the workflow.');
      setIsRunning(false);
      return;
    }

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, startId: startNodeId }),
      });

      const data = await response.json();
      if (data.eventId) {
        startPolling(data.eventId);
      } else {
        setIsRunning(false);
        console.error('Failed to start workflow execution');
      }
    } catch (err) {
      setIsRunning(false);
      console.error('Network error:', err.message);
    }
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
                Workflow properties
              </h3>
              <p className="mt-1 text-sm text-zinc-500 mb-3">
                Save, import and export your workflow
              </p>
              <div className="flex mt-1 flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer"
                  onClick={handleSaveWorkflow}
                >
                  Save Workflow
                </button>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer"
                  onClick={handleImportClick}
                >
                  Import Workflow
                </button>
                <button
                  type="button"
                  className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer"
                  onClick={handleExportWorkflow}
                >
                  Export Workflow
                </button>
              </div>
              
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-medium text-zinc-800">
                Run your Workflow
              </h3>
              <button
                type="button"
                disabled={isRunning}
                className="w-full rounded border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:border-transparent hover:bg-slate-600 hover:text-white active:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRunWorkflow}
              >
                {isRunning ? 'Running...' : 'Run Workflow'}
              </button>
            </div>
            {executionLog.length > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-sm font-medium text-zinc-800 mb-3">
                  Execution Log
                </h3>
                <div className="flex flex-col gap-2">
                  {executionLog.map((entry, i) => (
                    <div
                      key={`${entry.nodeId}-${i}`}
                      className="rounded border border-zinc-200 bg-white p-3"
                    >
                      <p className="text-xs text-zinc-500 mb-1">{entry.nodeId}</p>
                      <p className="text-sm text-zinc-700 mb-2">{entry.prompt}</p>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          entry.answer === 'YES'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.answer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}