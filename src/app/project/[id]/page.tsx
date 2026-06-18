export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Project: {id}</p>
    </div>
  );
}
