'use client'

import { Handle, Position } from '@xyflow/react'

export default function StartNode({ data }) {
  return (
    <div className="w-64 rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Node header */}
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <h3 className="text-sm font-semibold text-zinc-900">Start Node</h3>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  )
}