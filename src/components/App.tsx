import { data } from '@/data';
import FileExplorer from '@/components/FileExplorer';

export default function App() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">File Explorer</h1>
      <div className="w-96">
        <FileExplorer data={data} />
      </div>
    </div>
  );
}
