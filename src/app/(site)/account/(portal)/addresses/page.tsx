import { verifySession, getOrCreateCustomer } from "@/lib/auth";
import { query } from "@/lib/db";
import AddressBook, { type SavedAddress } from "./AddressBook";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = (await verifySession())!;
  const customer = (await getOrCreateCustomer(user))!;

  const addresses = await query<SavedAddress>(
    "SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC",
    [customer.id]
  );

  return (
    <AddressBook
      addresses={addresses}
      defaults={{ recipient_name: customer.name ?? "", phone: customer.phone ?? "" }}
    />
  );
}
