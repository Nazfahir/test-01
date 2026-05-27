import { Card } from '@/components/ui/Card';

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Card>
  );
}
