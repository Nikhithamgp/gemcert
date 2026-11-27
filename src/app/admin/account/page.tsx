import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/ui";
import { ChangePasswordForm } from "../users/user-forms";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account">
        {user.name} · {user.email} · {user.role.toLowerCase()}
      </PageHeader>
      <ChangePasswordForm />
    </>
  );
}
