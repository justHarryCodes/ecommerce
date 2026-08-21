import { notFound } from "next/navigation";
import { getCompany } from "@/lib/auth";
import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const company = await getCompany();
  if (!company) notFound();

  const paymentMethods: string[] = [];
  if (company.paymentPreference === "paystack" || company.paymentPreference === "both" || !company.paymentPreference) {
    paymentMethods.push("paystack");
  }
  if (company.paymentPreference === "bank_transfer" || company.paymentPreference === "both") {
    paymentMethods.push("transfer");
  }

  return (
    <CheckoutClient
      storeId={company.id}
      paymentMethods={paymentMethods}
      bankName={company.bankName ?? company.bank_name}
      accountNumber={company.bankAccountNumber ?? company.bank_account_number}
      accountName={company.bankAccountName ?? company.bank_account_name}
      whatsapp={company.whatsapp}
    />
  );
}
