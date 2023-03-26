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
