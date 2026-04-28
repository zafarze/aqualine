import { Breadcrumbs } from "@aqualine/ui";
import { ExpenseForm } from "../ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Финансы", href: "/finance" },
          { label: "Новый расход" },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">Новый расход</h1>
      <ExpenseForm />
    </div>
  );
}
