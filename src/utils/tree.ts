import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

export const NODE_KINDS = {
  Directory: 'directory',
  File: 'file',
} as const;
export type NodeKind = typeof NODE_KINDS[keyof typeof NODE_KINDS];

export const FileNodeSchema = z.object({
  name: z.string(),
  kind: z.literal('file'),
  size: z.string(),
  modified: z.string(),
});
export type FileNode = z.infer<typeof FileNodeSchema>;

export const BaseDirectoryNodeSchema = z.object({
  name: z.string(),
  kind: z.literal('directory'),
});

export type DirectoryNode = z.infer<typeof BaseDirectoryNodeSchema> & {
  children: (FileNode | DirectoryNode)[];
};

export const DirectoryNodeSchema: z.ZodType<DirectoryNode> = BaseDirectoryNodeSchema.extend({
  children: z.array(FileNodeSchema.or(z.lazy(() => DirectoryNodeSchema))),
});

export const TreeNodeSchema = z.union([DirectoryNodeSchema, FileNodeSchema]);
export type TreeNode = z.infer<typeof TreeNodeSchema>;

export type FlatTreeNode = {
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
