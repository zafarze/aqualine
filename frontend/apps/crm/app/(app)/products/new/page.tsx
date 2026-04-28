import { Breadcrumbs } from "@aqualine/ui";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Мой склад", href: "/products" },
          { label: "Новый товар" },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">Новый товар</h1>
      <ProductForm />
    </div>
  );
}
