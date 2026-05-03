import { Breadcrumbs } from "@aqualine/ui";
import { ClientForm } from "./clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Клиенты", href: "/clients" },
          { label: "Новый клиент" },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">Новый клиент</h1>
      <ClientForm />
    </div>
  );
}
