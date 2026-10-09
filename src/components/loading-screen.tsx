import { Loader2Icon } from "lucide-react";

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[260px] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-5">
        <Loader2Icon className="size-12 animate-spin text-purple-500" />
        <p className="text-center text-base md:text-lg">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
