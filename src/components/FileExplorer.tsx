import { createId } from '@paralleldrive/cuid2';
import { NodeKind, TreeNode, TreeNodeSchema } from '@/utils/tree';
import { ReactNode, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

type FlatTreeNode = {
  id: string;
  parentId?: string;
  level: number;
  name: string;
} & ({ kind: 'file'; size: string; modified: string } | { kind: 'directory' });

function flattenData(data: TreeNode, parentId?: string, level = 0): FlatTreeNode[] {
  const id = createId();

  if (data.kind === 'file') {
    return [
      {
        id,
        ...(parentId !== undefined && { parentId }),
        level,
        name: data.name,
        kind: data.kind,
        size: data.size,
        modified: data.modified,
      },
    ];
  }

  const flatNode: FlatTreeNode = {
    id,
    ...(parentId !== undefined && { parentId }),
    level,
    name: data.name,
    kind: data.kind,
  };

  const childNodes = data.children.flatMap((child) => flattenData(child, id, level + 1));

  return [flatNode, ...childNodes];
}

export function parseTreeData(data: unknown): FlatTreeNode[] {
  return flattenData(TreeNodeSchema.parse(data));
}

function getChildrenIds(
  nodeIds: Set<string>,
  topNodeId: string,
  treeData: FlatTreeNode[]
): string[] {
  const childrenIds: string[] = [];
  const selectedNodes = treeData.filter((node) => nodeIds.has(node.id));

  const findChildren = (parentId: string) => {
    for (const node of selectedNodes) {
      if (node.parentId === parentId) {
        childrenIds.push(node.id);

        if (node.kind === 'directory') {
          findChildren(node.id);
        }
      }
    }
  };

  findChildren(topNodeId);

  return childrenIds;
}

export default function FileExplorer({ data }: { data: unknown }) {
  const [treeData, setTreeData] = useState(parseTreeData(data));
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(
    new Set(new Set([treeData[0].id]))
  );
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const maxExpandedNodes = useMemo(
    () => treeData.filter((node) => node.kind === 'directory').length,
    [treeData.length]
  );
  // We only collapse all nodes if all the nodes are expanded
  const hasAllExpanded = expandedNodeIds.size === maxExpandedNodes;

  function handleNodeClick(id: string) {
    const node = treeData.find((node) => node.id === id);

    if (node === undefined) {
      return;
    }

    if (node.kind === 'directory') {
      setExpandedNodeIds((expandedNodeIds) => {
        const newExpandedNodeIds = new Set(expandedNodeIds);
        const newVisibleNodeIds = new Set(visibleNodeIds);

        if (newExpandedNodeIds.has(id)) {
          newExpandedNodeIds.delete(id);
          // Get all the children of the node that is being collapsed
          const visibleChildrenIds = getChildrenIds(visibleNodeIds, node.id, treeData);

          visibleChildrenIds.forEach((childId) => newVisibleNodeIds.delete(childId));
        } else {
          newExpandedNodeIds.add(id);
          // Get all the expanded children of the node that is being expanded
          // so that we can show them as well
          const expandedChildrenIds = getChildrenIds(expandedNodeIds, node.id, treeData);

          for (const child of treeData) {
            if (
              child.parentId &&
              (child.parentId === id || expandedChildrenIds.includes(child.parentId))
            ) {
              newVisibleNodeIds.add(child.id);
            }
          }
        }

        setVisibleNodeIds(newVisibleNodeIds);

        return newExpandedNodeIds;
      });
    }

    setSelectedNodeId(id);
  }

  function handleToggle() {
    if (hasAllExpanded) {
      setExpandedNodeIds(new Set());
      setVisibleNodeIds(new Set([treeData[0].id]));
    } else {
      const newExpandedNodeIds = new Set<string>();

      treeData.forEach((node) => {
        if (node.kind === 'directory') {
          newExpandedNodeIds.add(node.id);
        }
      });

      setExpandedNodeIds(newExpandedNodeIds);
      setVisibleNodeIds(new Set(treeData.map((node) => node.id)));
    }
  }

  function handleCreateFile(parentIndex: number) {
    const parent = treeData[parentIndex];
    const filename = prompt('Enter a filename');

    const newFile: FlatTreeNode = {
      id: createId(),
      parentId: parent.id,
      level: parent.level + 1,
      name: filename || 'Untitled',
      kind: 'file',
      size: '0 B',
      modified: 'Just now',
    };

    setTreeData([
      ...treeData.slice(0, parentIndex + 1),
      newFile,
      ...treeData.slice(parentIndex + 1),
    ]);

    if (expandedNodeIds.has(parent.id)) {
      setVisibleNodeIds((visibleNodeIds) => {
        const newVisibleNodeIds = new Set(visibleNodeIds);

        newVisibleNodeIds.add(newFile.id);

        return newVisibleNodeIds;
      });
    }
  }

  return (
    <div>
      {treeData.map((node, index) => (
        <FileExplorerNode
          append={
            node.kind === 'directory' ? (
              <div className="flex">
                <CreateFileButton onClick={() => handleCreateFile(index)} />
                {index === 0 && <ToggleButton isExpanded={hasAllExpanded} onClick={handleToggle} />}
              </div>
            ) : null
          }
          isOpen={expandedNodeIds.has(node.id)}
          isSelected={selectedNodeId === node.id}
          key={node.id}
          name={node.name}
          kind={node.kind}
          size={node.kind === 'file' ? node.size : undefined}
          onClick={() => {
            handleNodeClick(node.id);
          }}
          show={visibleNodeIds.has(node.id)}
          indent={node.level}
        />
      ))}
    </div>
  );
}

function FileExplorerNode({
  name,
  kind,
  size,
  show,
  isOpen,
  isSelected,
  onClick,
  indent,
  append,
}: {
  append?: ReactNode;
  indent: number;
  isOpen: boolean;
  isSelected: boolean;
  kind: NodeKind;
  name: string;
  onClick: () => void;
  show: boolean;
  size?: string;
}) {
  if (!show) {
    return null;
  }

  return (
    <div
      style={{ marginLeft: `${indent}rem` }}
      className={clsx('flex items-center group', {
        'bg-cyan-50 text-cyan-600 rounded-md': isSelected,
      })}
    >
      <button
        className="flex items-center w-full py-0.5 px-2 focus:outline-2 outline-cyan-600"
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
        <div className="flex justify-between w-full group">
          {name}{' '}
          {size && (
            <span className="text-gray-400 text-xs self-center group-hover:block hidden">
              {size}
            </span>
          )}
        </div>
      </button>
      {append && <div className="hidden group-hover:block">{append}</div>}
    </div>
  );
}

function ToggleButton({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) {
  return (
    <button
      className="hover:bg-gray-300  hover: w-5 h-5 rounded-md flex items-center justify-center"
      onClick={onClick}
      title={isExpanded ? 'Collapse all' : 'Expand all'}
    >
      {isExpanded ? (
        <ChevronUpIcon className="inline-block w-4 h-4" />
      ) : (
        <ChevronDownIcon className="inline-block w-4 h-4" />
      )}
    </button>
  );
}

function CreateFileButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="hover:bg-gray-300 w-5 h-5 rounded-md flex items-center justify-center"
      onClick={onClick}
      title="Create file"
    >
      <PlusIcon className="inline-block w-4 h-4" />
    </button>
  );
}
