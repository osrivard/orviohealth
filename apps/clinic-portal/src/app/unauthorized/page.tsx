export default function Unauthorized() {
  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Accès refusé</h1>
        <p>Votre rôle n'a pas accès à cette section.</p>
        <a href="/dashboard">Retour au tableau de bord</a>
      </div>
    </div>
  );
}
