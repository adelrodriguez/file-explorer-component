import { createId } from '@paralleldrive/cuid2';
import { data } from '@/data';
import { NodeKind, TreeNode, TreeNodeSchema } from '@/utils/tree';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { DocumentIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

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
  const treeData = useMemo(() => parseTreeData(data), [data]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // We set the root node as visible here. We avoid passing the treeData
    // directly to the state as this brings issues during development, as React
    // in Strict Mode will re-calculate the memo and the visible node ids will
    // not match.
    const root = new Set([treeData[0].id]);
    setVisibleNodeIds(root);
  }, []);

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

  return (
    <div>
      {treeData.map((node) => (
        <FileExplorerNode
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
}: {
  name: string;
  size?: string;
  kind: NodeKind;
  show: boolean;
  isOpen: boolean;
  isSelected: boolean;
  onClick: () => void;
  indent: number;
}) {
  if (!show) {
    return null;
  }

  return (
    <div style={{ marginLeft: `${indent}rem` }}>
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
        <div className="flex justify-between w-full">
          {name} {size && <span className="text-gray-400 text-xs self-center">({size})</span>}
        </div>
      </button>
    </div>
  );
}
