import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Reviews() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-6">Reviews</h1>
            <p className="text-muted-foreground">Bekijk en reageer op klantbeoordelingen.</p>
          </div>
        </main>
      </div>
    </div>
  );
}