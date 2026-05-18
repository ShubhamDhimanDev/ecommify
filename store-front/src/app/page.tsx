import Link from "next/link";
import { redirect } from "next/navigation";
import { detectTenantContext } from "@/lib/theme/engine/tenant";

export default async function Home() {
  const tenantContext = await detectTenantContext();

  if (tenantContext.storeSlug) {
    redirect(`/${tenantContext.storeSlug}`);
  }

  return (
    <div className="space-y-12 p-4 md:p-8">
      <section className="air-card relative overflow-hidden rounded-[28px] bg-surface-container py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="display-lg-mobile mb-4 text-foreground">Tenant-aware storefront ready</h1>
          <p className="mb-8 text-lg font-semibold text-secondary">
            Open a tenant route to render a section-based theme, for example /demo-store.
          </p>
          <Link href="/demo-store" className="btn-primary">
            Open demo store
          </Link>
        </div>
      </section>
    </div>
  );
}
