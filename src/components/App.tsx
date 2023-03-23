import { useState } from 'react';
import { FolderIcon, DocumentIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';

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

// type FileNode =
//   | { name: string; kind: 'file'; size: string; modified: 'string' }
//   | { name: string; kind: 'directory'; children: FileNode[] };

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

const TreeNodeSchema = z.union([DirectoryNodeSchema, FileNodeSchema]);
type TreeNode = z.infer<typeof TreeNodeSchema>;

export default function App() {
  const parsedData = TreeNodeSchema.parse(data);

  return (
    <div>
      <h1 className="text-2xl font-bold">File Explorer</h1>
      <FileExplorer data={parsedData} />
    </div>
  );
}

function FileExplorer({ data }: { data: TreeNode }) {
  if (data.kind === 'file') {
    return (
      <div className="flex">
        <DocumentIcon className="inline-block w-4 h-4 mr-2" />
        {data.name} ({data.size})
      </div>
    );
  }

  if (data.kind === 'directory') {
    return <FileExplorerDirectory data={data} />;
  }

  throw new Error('Exhausted kinds. Invalid data.');
}

function FileExplorerDirectory({ data }: { data: DirectoryNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center">
        {open ? (
          <FolderOpenIcon className="inline-block w-4 h-4 mr-2" />
        ) : (
          <FolderIcon className="inline-block w-4 h-4 mr-2" />
        )}

        <div onClick={() => setOpen(!open)}>{data.name}</div>
      </div>
      {open && (
        <div className="pl-2">
          {data.children.map((child, index) => (
            <FileExplorer data={child} key={child.name + index} />
          ))}
        </div>
      )}
    </div>
  );
}
