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
