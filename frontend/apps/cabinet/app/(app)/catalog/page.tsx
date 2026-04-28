"use client";

import { useEffect, useState } from "react";
import { api, Paginated } from "../../../lib/api";
import { addToCart } from "../../../lib/cart";

interface Product {
  id: number;
  sku: string;
  name: string;
  unit_display: string;
  sale_price: string;
  stock: string;
  stock_status: string;
}

export default function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    api<Paginated<Product>>(`/products/${q}`)
      .then((d) => {
        if (alive) setItems(d.results);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#2e2a55] mb-4">Каталог</h1>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по артикулу или названию"
        className="w-full mb-4 rounded-xl bg-white px-4 py-3 outline-none border border-[#e5e2f5]"
      />
      {loading && <p className="text-[#7B7AA8]">Загрузка...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <article
            key={p.id}
            className="bg-white rounded-2xl p-4 shadow-[6px_6px_18px_#e5e2f5,-6px_-6px_18px_#ffffff]"
          >
            <h3 className="font-medium text-[#2e2a55]">{p.name}</h3>
            <p className="text-xs text-[#7B7AA8] mb-2">{p.sku}</p>
            <p className="text-lg font-semibold text-[#2e2a55]">
              {p.sale_price} с.
              <span className="text-xs text-[#7B7AA8] ml-1">/ {p.unit_display}</span>
            </p>
            <p className="text-xs text-[#7B7AA8] mb-3">
              Остаток: {p.stock}{" "}
              <span
                className={
                  p.stock_status === "out_of_stock"
                    ? "text-red-500"
                    : p.stock_status === "reorder"
                      ? "text-yellow-600"
                      : "text-green-600"
                }
              >
                ●
              </span>
            </p>
            <button
              onClick={() =>
                addToCart({
                  product_id: p.id,
                  sku: p.sku,
                  name: p.name,
                  price: p.sale_price,
                  quantity: 1,
                })
              }
              disabled={p.stock_status === "out_of_stock"}
              className="w-full rounded-xl bg-[#8E7CF8] text-white py-2 disabled:opacity-50"
            >
              В корзину
            </button>
          </article>
        ))}
      </div>
      {!loading && items.length === 0 && (
        <p className="text-[#7B7AA8] text-center py-8">Товары не найдены</p>
      )}
    </div>
  );
}
