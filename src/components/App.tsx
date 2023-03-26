import { data } from '@/data';
import FileExplorer from '@/components/FileExplorer';
import { useState } from 'react';
import { FlatTreeNode } from '@/utils/tree';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<FlatTreeNode | undefined>(undefined);
  return (
    <div className="w-full h-screen bg-black">
      <div className="flex w-full h-full">
        <div className="w-96 px-4 mt-4">
          <h1 className="text-2xl font-bold text-white mb-4">File Explorer</h1>
          <FileExplorer data={data} onSelect={setSelectedNode} />
        </div>
        <div className="bg-white h-full w-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="flex items-center">
              <div className="text-gray-500 text-sm">Selected Node:</div>
              <div className="ml-2 text-sm font-medium text-gray-900">
                {selectedNode ? selectedNode.name : 'None'}
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mt-2 text-sm font-medium text-gray-900">
              <pre>{JSON.stringify(selectedNode, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
