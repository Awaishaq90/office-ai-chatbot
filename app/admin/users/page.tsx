import { auth } from "@/app/(auth)/auth";
import { getAllUsers } from "@/lib/db/queries";
import { AddUserDialog } from "./add-user-dialog";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([auth(), getAllUsers()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-base">Users</h2>
          <p className="text-muted-foreground text-sm">
            {users.length} {users.length === 1 ? "user" : "users"}
          </p>
        </div>
        <AddUserDialog />
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-normal">Email</th>
              <th className="px-4 py-2 font-normal">Joined</th>
              <th className="px-4 py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr className="border-border/50 border-t" key={u.id}>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {u.id === session?.user?.id ? (
                    <span className="text-muted-foreground text-xs">(you)</span>
                  ) : (
                    <DeleteUserButton email={u.email} userId={u.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
