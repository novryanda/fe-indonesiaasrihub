import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/nasional");
  return <>Coming Soon</>;
}
