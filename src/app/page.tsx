import HomeContent from "@/components/home-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default async function Page({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  return <HomeContent searchParams={sp} />;
}
