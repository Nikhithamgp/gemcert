import { requirePermission } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { CreateUserForm, UserRow } from "./user-forms";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requirePermission("users:manage");
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return (
    <>
      <PageHeader title="Users">Operators prepare drafts; administrators publish, void and manage settings.</PageHeader>
      <div className="space-y-8">
        <section className="card divide-y divide-border">
          {users.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === me.id} />
          ))}
        </section>
        <CreateUserForm />
      </div>
    </>
  );
}
