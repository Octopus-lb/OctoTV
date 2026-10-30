"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    inferAdditionalFields({
      user: {
        preferredLocale: { type: "string", required: false },
        role: { type: "string", required: false },
      },
    }),
  ],
});

export type AuthClientError = {
  message?: string;
  status?: number;
  code?: string;
};
