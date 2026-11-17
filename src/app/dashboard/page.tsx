import { redirect } from "next/navigation";
import { signOut, auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function logOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>You are signed in</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
          <form action={logOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
