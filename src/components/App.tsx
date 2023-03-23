import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FolderIcon, DocumentIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import clsx from 'clsx';
import { createId } from '@paralleldrive/cuid2';

const data = {
  name: 'project',
  kind: 'directory',
  children: [
    {
      name: 'src',
      kind: 'directory',
      children: [
        {
          name: 'index.js',
          kind: 'file',
          size: '1KB',
          modified: '2022-03-08 11:30:00',
        },
        {
          name: 'components',
          kind: 'directory',
          children: [
            {
              name: 'Button.jsx',
              kind: 'file',
              size: '2KB',
              modified: '2022-03-07 15:00:00',
            },
            {
              name: 'Card.jsx',
              kind: 'file',
              size: '3KB',
              modified: '2022-03-06 10:00:00',
            },
          ],
        },
        {
          name: 'styles',
          kind: 'directory',
          children: [
            {
              name: 'index.css',
              kind: 'file',
              size: '1KB',
              modified: '2022-03-07 09:00:00',
            },
            {
              name: 'components.css',
              kind: 'file',
              size: '2KB',
              modified: '2022-03-06 12:00:00',
            },
          ],
        },
      ],
    },
    {
      name: 'public',
      kind: 'directory',
      children: [
        {
          name: 'index.html',
          kind: 'file',
          size: '1KB',
          modified: '2022-03-08 10:00:00',
        },
        {
          name: 'favicon.ico',
          kind: 'file',
          size: '5KB',
          modified: '2022-03-07 16:00:00',
        },
      ],
    },
    {
      name: 'package.json',
      kind: 'file',
      size: '1KB',
      modified: '2022-03-08 12:00:00',
    },
    {
      name: 'README.md',
      kind: 'file',
      size: '2KB',
      modified: '2022-03-08 13:00:00',
    },
  ],
};

const NODE_KINDS = {
  Directory: 'directory',
  File: 'file',
} as const;
type NodeKind = typeof NODE_KINDS[keyof typeof NODE_KINDS];

/**
 * Adds an id to each node in the tree
 */
function addIds(data: RawTreeNode): (FileNode & { id: string }) | (DirectoryNode & { id: string }) {
  if (data.kind === 'file') {
    return {
      ...data,
      id: createId(),
    };
  }

  if (data.kind === 'directory') {
    return {
      ...data,
      id: createId(),
      children: data.children.map(addIds),
    };
  }

  throw new Error('Exhausted kinds. Invalid data.');
}

function getDirectoryIds(node: TreeNode): string[] {
  const ids: string[] = [];

  if (node.kind !== 'directory') {
    return ids;
  }

  ids.push(node.id);

  for (const child of node.children) {
    const childIds = getDirectoryIds(child);
    ids.push(...childIds);
  }

  return ids;
}

const FileNodeSchema = z.object({
  name: z.string(),
  kind: z.literal('file'),
  size: z.string(),
  modified: z.string(),
});

type FileNode = z.infer<typeof FileNodeSchema>;

const BaseDirectoryNodeSchema = z.object({
  name: z.string(),
  kind: z.literal('directory'),
});

type DirectoryNode = z.infer<typeof BaseDirectoryNodeSchema> & {
  children: (FileNode | DirectoryNode)[];
};

const DirectoryNodeSchema: z.ZodType<DirectoryNode> = BaseDirectoryNodeSchema.extend({
  children: z.array(FileNodeSchema.or(z.lazy(() => DirectoryNodeSchema))),
});

const RawTreeNodeSchema = z.union([DirectoryNodeSchema, FileNodeSchema]);
type RawTreeNode = z.infer<typeof RawTreeNodeSchema>;

const TreeNodeSchema = RawTreeNodeSchema.transform(addIds);
type TreeNode = z.infer<typeof TreeNodeSchema>;

function parseTreeData(data: unknown): TreeNode {
  return TreeNodeSchema.parse(data);
}

export default function App() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">File Explorer</h1>
      <div className="w-96">
        <FileExplorer data={data} />
      </div>
    </div>
  );
}

const FileExplorerContext = createContext<
  | {
      data: TreeNode & { id: string };
      getNodeData: (id: string) => TreeNode | null;
      selectedNode: string;
      handleNodeClick: (id: string) => void;
      openNodes: string[];
    }
  | undefined
>(undefined);

function FileExplorerProvider({
  data,
  children,
}: {
  data: unknown;
  children: ({
    id,
    onExpandAll,
    onCollapseAll,
  }: {
    id: string;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    hasOpen: boolean;
  }) => ReactNode;
}) {
  const [treeData, setTreeData] = useState(parseTreeData(data));
  const [selectedNode, setSelectedNode] = useState('');
  const [openNodes, setOpenNodes] = useState<string[]>([]);
  const directoryIds = useMemo(() => getDirectoryIds(treeData), [treeData]);

  function getNodeData(node: TreeNode, id: string): TreeNode | null {
    if (node.id === id) {
      return node;
    }

    if (node.kind === 'file') {
      return null;
    }

    for (const child of node.children) {
      const result = getNodeData(child, id);

      if (result) return result;
    }

    return null;
  }

  function handleNodeClick(id: string) {
    setSelectedNode(id);

    if (openNodes.includes(id)) {
      setOpenNodes((openNodes) => openNodes.filter((node) => node !== id));
      return;
    }

    setOpenNodes((openNodes) => [...openNodes, id]);
  }

  function handleExpandAll() {
    setOpenNodes(directoryIds);
  }

  function handleCollapseAll() {
    setOpenNodes([]);
  }

  return (
    <FileExplorerContext.Provider
      value={{
        data: treeData,
        getNodeData: (id) => getNodeData(treeData, id),
        selectedNode,
        handleNodeClick,
        openNodes,
      }}
    >
      {children({
        id: treeData.id,
        onExpandAll: handleExpandAll,
        onCollapseAll: handleCollapseAll,
        hasOpen: openNodes.length > 0,
      })}
    </FileExplorerContext.Provider>
  );
}

function useTreeNode(id: string): {
  node: TreeNode & { id: string };
  isSelected: boolean;
  handleNodeClick: (id: string) => void;
  isOpen: boolean;
} {
  const context = useContext(FileExplorerContext);

  if (context === undefined) {
    throw new Error('useFileExplorer must be used within a FileExplorerProvider');
  }

  const node = context.getNodeData(id);

  if (node === null) {
    throw new Error('Invalid node id');
  }

  return {
    node,
    isSelected: context.selectedNode === id,
    isOpen: context.openNodes.includes(id),
    handleNodeClick: context.handleNodeClick,
  };
}

function FileExplorer({ data }: { data: unknown }) {
  // TODO(adelrodriguez): Handle the case where the data is invalid.

  return (
    <FileExplorerProvider data={data}>
      {({ id, onExpandAll, onCollapseAll, hasOpen }) => (
        <div className="relative" onDoubleClick={hasOpen ? onCollapseAll : onExpandAll}>
          <FileExplorerNode id={id} />
        </div>
      )}
    </FileExplorerProvider>
  );
}

function FileExplorerNode({ id }: { id: string }) {
  const { node, isSelected, handleNodeClick, isOpen } = useTreeNode(id);

  return (
    <div className="pl-2">
      <FileExplorerNodeButton
        name={node.name}
        kind={node.kind}
        isOpen={isOpen}
        isSelected={isSelected}
        onClick={() => handleNodeClick(id)}
      />

      {node.kind === 'directory' && isOpen && (
        <div className="relative my-0.5">
          <div className="absolute left-2.5 w-px h-full bg-gray-200" />
          <div className="pl-2">
            {node.children.map((child) => (
              // TODO(adelrodriguez): Fix this later
              <FileExplorerNode id={child.id} key={child.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileExplorerNodeButton({
  name,
  kind,
  isSelected,
  isOpen,
  onClick,
}: {
  name: string;
  kind: NodeKind;
  isSelected: boolean;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx('flex items-center w-full py-0.5 px-2 focus:outline-2 outline-cyan-600', {
        'bg-cyan-50 text-cyan-600 rounded-md': isSelected,
      })}
      onClick={onClick}
    >
      {kind === 'file' ? <DocumentIcon className="inline-block w-4 h-4 mr-2" /> : null}
      {kind === 'directory' ? (
        isOpen ? (
          <FolderOpenIcon className="inline-block w-4 h-4 mr-2" />
        ) : (
          <FolderIcon className="inline-block w-4 h-4 mr-2" />
        )
      ) : null}
      <div>{name}</div>
    </button>
  );
}
