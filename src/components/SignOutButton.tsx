import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-ghost btn-sm btn-block">
        Sign out
      </button>
    </form>
  );
}
