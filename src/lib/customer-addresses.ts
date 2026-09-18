import { query } from "./db";

// Mirrors the default address onto customers.address/city/state so the
// existing checkout prefill (which reads the customers row) keeps working.
// Clears those fields when the address book is empty.
export async function syncDefaultAddress(customerId: string): Promise<void> {
  await query(
    `UPDATE customers c SET
       address = d.address, city = d.city, state = d.state,
       phone = COALESCE(NULLIF(c.phone, ''), d.phone), updated_at = NOW()
     FROM (SELECT address, city, state, phone FROM customer_addresses
           WHERE customer_id = $1 AND is_default LIMIT 1) d
     WHERE c.id = $1`,
    [customerId]
  );
  await query(
    `UPDATE customers SET address = NULL, city = NULL, state = NULL, updated_at = NOW()
     WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM customer_addresses WHERE customer_id = $1)`,
    [customerId]
  );
}
