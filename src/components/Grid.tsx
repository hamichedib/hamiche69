import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "poster" | "tile";
}

export function Grid({ children, variant = "poster" }: Props) {
  return (
    <div
      className={
        variant === "poster"
          ? "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          : "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {children}
    </div>
  );
}
