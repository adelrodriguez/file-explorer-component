import { PlusIcon } from '@heroicons/react/24/outline';

export default function CreateFileButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="hover:bg-cyan-600 bg-opacity-30 text-inherit w-5 h-5 rounded-md flex items-center justify-center mx-1"
      onClick={onClick}
      title="Create file"
    >
      <PlusIcon className="inline-block w-4 h-4" />
    </button>
  );
}
