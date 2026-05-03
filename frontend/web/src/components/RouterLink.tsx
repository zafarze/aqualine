import { Link } from "react-router-dom";
import type { ComponentProps } from "react";

/** Адаптер: UI-кит передаёт `href`, react-router ждёт `to`. */
export function RouterLink({ href, ...rest }: ComponentProps<"a"> & { href: string }) {
  return <Link to={href} {...rest} />;
}
