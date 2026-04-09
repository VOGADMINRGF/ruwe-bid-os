import SiteCreateForm from "@/components/forms/SiteCreateForm";

export default function NewSitePage() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Neuen Standort anlegen</h1>
        <p className="sub">Formale RUWE-Sites und operative Standorte anlegen.</p>
      </div>
      <div className="card">
        <SiteCreateForm />
      </div>
    </div>
  );
}
