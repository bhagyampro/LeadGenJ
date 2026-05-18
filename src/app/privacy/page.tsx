export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-slate-600">LeadgenJ privacy notice</p>
        </div>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Data We Collect</h2>
          <p className="text-slate-700">
            We collect account details such as name, email, workspace information, connected account
            metadata, imported lead records, campaign settings, messages, API keys, and billing-related
            plan information needed to operate the product.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <p className="text-slate-700">
            We use data to authenticate users, manage workspaces, import and organize leads, create
            campaigns, provide analytics, support integrations, and improve product reliability.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">LinkedIn Connection</h2>
          <p className="text-slate-700">
            When you connect LinkedIn, LeadgenJ stores the authorization result needed to identify the
            connected account and show connection status. LeadgenJ does not use this connection to bypass
            LinkedIn controls or scrape LinkedIn pages.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Data Sharing</h2>
          <p className="text-slate-700">
            We do not sell personal data. Data may be processed by infrastructure providers such as hosting,
            database, authentication, email, analytics, and payment services required to run the app.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Deletion Requests</h2>
          <p className="text-slate-700">
            Users can request account or workspace data deletion by contacting the app owner or administrator.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-slate-700">For privacy requests, contact the LeadgenJ administrator.</p>
        </section>
      </div>
    </main>
  )
}
