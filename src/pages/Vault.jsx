import { useAuth } from '../lib/AuthContext'

export default function Vault() {
  const { user, signOut } = useAuth()

  return (
    <main>
      <h1>Your vault</h1>
      <p>Signed in as {user.email}</p>
      <p>Nothing here yet — import and gallery land in the next phase.</p>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  )
}
