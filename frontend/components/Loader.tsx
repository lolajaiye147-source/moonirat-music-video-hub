import { Music2 } from 'lucide-react';

interface Props { message?: string; }

export default function Loader({ message = 'Loading…' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
      <Music2 className="w-8 h-8 text-moon-500 animate-pulse" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
