import type { AppRouter } from "@pubint/index-pdf-backend";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
