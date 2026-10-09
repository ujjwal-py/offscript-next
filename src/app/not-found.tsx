import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-tech text-4xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">This page could not be found.</p>
      <Link href="/home" className="text-primary underline-offset-4 hover:underline">
        Go back home
      </Link>
    </div>
  );
}
