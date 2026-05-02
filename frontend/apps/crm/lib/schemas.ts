import { z } from "zod";

const decimalString = (max = 12) =>
  z
    .string()
    .trim()
    .regex(/^-?\d+([.,]\d{1,2})?$/, "Ожидается число (например, 12.50)")
    .refine((s: string) => s.length <= max + 3, "Слишком большое число")
    .transform((s: string) => s.replace(",", "."));

const nonNegativeDecimal = decimalString().refine(
  (s: string) => parseFloat(s) >= 0,
  "Не может быть отрицательным"
);

const positiveDecimal = decimalString().refine(
  (s: string) => parseFloat(s) > 0,
  "Должно быть больше нуля"
);

export const phoneRegex = /^\+?[0-9\s\-()]{6,32}$/;

export const clientSchema = z.object({
  name: z.string().min(1, "Укажите наименование").max(255),
  type: z.enum(["physical", "legal", "entrepreneur"]),
  inn: z
    .string()
    .max(32)
    .refine((s: string) => s === "" || /^[0-9]{6,20}$/.test(s), "ИНН: 6–20 цифр"),
  phone: z
    .string()
    .max(32)
    .refine((s: string) => s === "" || phoneRegex.test(s), "Некорректный телефон"),
  email: z
    .string()
    .max(254)
    .refine(
      (s: string) => s === "" || z.string().email().safeParse(s).success,
      "Некорректный email"
    ),
  address: z.string().max(2000).optional().default(""),
  segment: z.enum(["retail", "b2b", "dealer", "other"]),
  status: z.enum(["lead", "active", "vip", "blocked"]),
  manager: z.number().int().nullable().optional(),
  notes: z.string().optional().default(""),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

export const productSchema = z.object({
  sku: z.string().min(1, "Укажите артикул").max(64),
  name: z.string().min(1, "Укажите название").max(255),
  unit: z.enum(["pcs", "m", "kg", "l", "pack"]),
  purchase_price: nonNegativeDecimal,
  sale_price: nonNegativeDecimal,
  stock: nonNegativeDecimal,
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const orderItemSchema = z.object({
  id: z.number().optional(),
  product: z.number({ invalid_type_error: "Выберите товар" }).int().positive(),
  quantity: positiveDecimal,
  price: nonNegativeDecimal,
  discount: decimalString().refine((s: string) => {
    const n = parseFloat(s);
    return n >= 0 && n <= 100;
  }, "Скидка 0–100%"),
});

export const orderSchema = z.object({
  client: z.number({ invalid_type_error: "Выберите клиента" }).int().positive(),
  manager: z.number().int().nullable().optional(),
  status: z.enum([
    "lead",
    "quoted",
    "confirmed",
    "shipped",
    "paid",
    "cancelled",
  ]),
  due_date: z
    .string()
    .nullable()
    .refine((s: string | null) => {
      if (!s) return true;
      const d = new Date(s);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }, "Срок не может быть в прошлом")
    .optional(),
  notes: z.string().optional().default(""),
  items: z.array(orderItemSchema).min(1, "Добавьте хотя бы одну позицию"),
});
export type OrderFormValues = z.infer<typeof orderSchema>;
