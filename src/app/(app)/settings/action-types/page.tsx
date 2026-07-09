import { redirect } from "next/navigation";

// A gestão de categorias virou a aba "Categorias" de /settings — redirect
// mantém bookmarks/links antigos funcionando.
export default function ActionTypesPage() {
  redirect("/settings?tab=categorias");
}
