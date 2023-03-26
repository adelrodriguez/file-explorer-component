import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function ToggleButton({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="hover:bg-cyan-600 bg-opacity-30 w-5 h-5 mx-1 rounded-md flex items-center justify-center"
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
