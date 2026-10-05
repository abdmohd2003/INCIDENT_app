

// import type { ReactNode } from "react";
// import "./globals.css";

// import { AuthProvider } from "@/lib/auth/auth-context";

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body>
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   );
// }


import type { ReactNode } from "react";

import "./globals.css";

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
