import { NodeKind } from '@/utils/tree';
import { DocumentIcon, FolderOpenIcon, FolderIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { ReactNode, useEffect, useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';

interface DragItem {
  index: number;
  type: 'node';
}

export default function FileExplorerNode({
  append,
  indent,
  index,
  isOpen,
  isSelected,
  kind,
  move,
  name,
  onClick,
  onDragStart,
  show,
  size,
}: {
  append?: ReactNode;
  indent: number;
  index: number;
  isOpen: boolean;
  isSelected: boolean;
  kind: NodeKind;
  move: (dragIndex: number, hoverIndex: number) => void;
  name: string;
  onClick: () => void;
  onDragStart?: () => void;
  show: boolean;
  size?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: 'node',
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
    }),
    hover: (item, monitor) => {
      console.log({ item });
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset()!;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      move(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node',
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    if (isDragging && onDragStart) {
      onDragStart();
    }
  }, [isDragging]);

  drag(drop(ref));

  return (
    <div
      style={{ marginLeft: `${indent}rem` }}
      className={clsx('flex items-center group', {
        'bg-cyan-50 text-cyan-600 rounded-md': isSelected,
        'opacity-50': isDragging,
      })}
      ref={ref}
    >
      {show ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
