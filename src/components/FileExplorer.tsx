import { createId } from '@paralleldrive/cuid2';
import { useMemo, useState } from 'react';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FlatTreeNode, parseTreeData } from '@/utils/tree';
import FileExplorerNode from '@/components/FileExplorerNode';
import CreateFileButton from '@/components/CreateFileButton';
import ToggleButton from '@/components/ToggleButton';

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

  function hideDirectoryChildren(id: string) {
    const newExpandedNodeIds = new Set(expandedNodeIds);
    const newVisibleNodeIds = new Set(visibleNodeIds);

    newExpandedNodeIds.delete(id);
    // Get all the children of the node that is being collapsed
    const visibleChildrenIds = getChildrenIds(visibleNodeIds, id, treeData);

    visibleChildrenIds.forEach((childId) => newVisibleNodeIds.delete(childId));

    setVisibleNodeIds(newVisibleNodeIds);
    setExpandedNodeIds(newExpandedNodeIds);
  }

  function showDirectoryChildren(id: string) {
    const newExpandedNodeIds = new Set(expandedNodeIds);
    const newVisibleNodeIds = new Set(visibleNodeIds);

    newExpandedNodeIds.add(id);
    // Get all the expanded children of the node that is being expanded
    // so that we can show them as well
    const expandedChildrenIds = getChildrenIds(expandedNodeIds, id, treeData);

    for (const child of treeData) {
      if (
        child.parentId &&
        (child.parentId === id || expandedChildrenIds.includes(child.parentId))
      ) {
        newVisibleNodeIds.add(child.id);
      }
    }

    setVisibleNodeIds(newVisibleNodeIds);
    setExpandedNodeIds(newExpandedNodeIds);
  }

  function handleNodeClick(id: string) {
    const node = treeData.find((node) => node.id === id);

    if (node === undefined) {
      return;
    }

    if (node.kind === 'directory') {
      if (expandedNodeIds.has(id)) {
        hideDirectoryChildren(id);
      } else {
        showDirectoryChildren(id);
      }
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

  function handleMove(fromIndex: number, toIndex: number) {
    const dragNode = treeData[fromIndex];
    const targetNode = treeData[toIndex];

    // TODO(adelrodriguez): Handle moving directories
    if (dragNode.kind === 'directory') {
      return;
    }

    const newTreeData = [...treeData];
    dragNode.parentId = targetNode.parentId;
    dragNode.level = targetNode.level;

    newTreeData.splice(fromIndex, 1);
    newTreeData.splice(toIndex, 0, dragNode);
    setTreeData(newTreeData);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      {treeData.map((node, index) => (
        <FileExplorerNode
          index={index}
          key={node.id}
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
          name={node.name}
          kind={node.kind}
          size={node.kind === 'file' ? node.size : undefined}
          onClick={() => {
            handleNodeClick(node.id);
          }}
          show={visibleNodeIds.has(node.id)}
          indent={node.level}
          move={handleMove}
          onDragStart={() => {
            if (node.kind === 'directory') {
              hideDirectoryChildren(node.id);
            }
          }}
        />
      ))}
    </DndProvider>
  );
}
