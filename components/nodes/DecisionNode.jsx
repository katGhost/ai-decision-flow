'use client'

import { Handle, Position } from '@xyflow/react'

export default function DecisionNode({ data }) {
  return (
    <div className="w-64 rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      
      {/* Incoming connection */}
      <Handle type="target" position={Position.Top} />

      {/* Node header */}
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-900">Decision Node</h3>
      </div>

      {/* Editable prompt */}
      <div className="p-4">
        <textarea
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          rows={3}
          placeholder="Enter your yes/no question..."
          value={data.prompt || ''}
          onChange={(e) => data.onChange(e.target.value)}
        />
      </div>

      {/* YES / NO source handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '70%' }}
      />
    </div>
  )
}