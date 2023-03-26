import { PlusIcon } from '@heroicons/react/24/outline';

export default function CreateFileButton({ onClick }: { onClick: () => void }) {
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
