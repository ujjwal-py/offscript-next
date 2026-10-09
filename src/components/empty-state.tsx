function EmptyState({ message = "No posts found." }: { message?: string }) {
  return (
    <div className="flex min-h-[180px] w-full items-center justify-center p-8">
      <p className="text-center text-lg text-muted-foreground">{message}</p>
    </div>
  );
}

export default EmptyState;
