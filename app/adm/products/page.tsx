import { getProducts, countProducts } from "@/lib/actions/products";
import { ProductsClient } from "./client";

export default async function ProductsPage() {
  const [products, totalCount] = await Promise.all([
    getProducts(),
    countProducts(),
  ]);
  return <ProductsClient initialProducts={products} totalCount={totalCount} />;
}
