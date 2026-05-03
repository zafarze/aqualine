
import { useEffect, useState } from "react";
import { Link } from "@/lib/next-shim";
import { useParams } from "@/lib/next-shim";
import { Breadcrumbs, Card } from "@aqualine/ui";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductForm } from "./products/ProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setNotFound(false);
    setError(null);
    api<Product>(`/products/${id}/`)
      .then((p) => {
        if (alive) setProduct(p);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
        } else {
          setError(e instanceof Error ? e.message : "Ошибка");
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const title = product
    ? `${product.sku} · ${product.name}`
    : notFound
      ? "Товар не найден"
      : "Загрузка...";

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Мой склад", href: "/products" }, { label: title }]}
      />
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {notFound ? (
        <Card className="p-8 text-center">
          <p className="text-ink-soft mb-4">
            Товар с ID {id} не существует. Возможно, он был удалён или ID
            сменился после перезагрузки демо-данных.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-xl bg-accent-violet px-5 py-2 text-white"
          >
            Вернуться к списку товаров
          </Link>
        </Card>
      ) : error ? (
        <Card className="p-5 text-sm text-accent-pink">{error}</Card>
      ) : product ? (
        <ProductForm initial={product} />
      ) : (
        <Card className="p-10 text-center text-ink-soft text-sm">
          Загрузка...
        </Card>
      )}
    </div>
  );
}
