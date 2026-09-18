import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = (await verifySession())!;
  const customer = (await getOrCreateCustomer(user))!;

  return (
    <ProfileForm
      email={user.email}
      initial={{ name: customer.name ?? "", phone: customer.phone ?? "" }}
    />
  );
}
