export { default } from "next-auth/middleware";

export const config = {
    matcher: ["/dashboard/:path*", "/templates/:path*", "/api/invoices/:path*"],
};
