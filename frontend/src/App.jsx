import { useEffect, useState } from "react";
import { getUser, loginUser, registerUser, suggestUsernames } from "./api.js";

const emptyRegister = { username: "", email: "", password: "", address: "" };
const emptyLogin = { email: "", password: "" };

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem("session"));
    return session?.token && session?.id ? session : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [view, setView] = useState("login");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [session, setSession] = useState(readSession);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(Boolean(session));
  const [submitting, setSubmitting] = useState(false);
  const [interests, setInterests] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoadingProfile(true);
    getUser(session.id, session.token)
      .then(({ user }) => {
        if (active) setProfile(user);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem("session");
          setSession(null);
          setView("login");
          setMessage("Please log in again.");
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });
    return () => { active = false; };
  }, [session]);

  function switchView(nextView) {
    setView(nextView);
    setError("");
    setMessage("");
  }

  async function handleRegister(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await registerUser(registerForm);
      setLoginForm({ email: registerForm.email, password: "" });
      setRegisterForm(emptyRegister);
      setInterests("");
      setSuggestions([]);
      setView("login");
      setMessage("Account created. Please log in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSuggestions() {
    const values = interests.split(",").map((value) => value.trim()).filter(Boolean);
    if (values.length === 0) {
      setError("Enter at least one interest first.");
      return;
    }
    setSuggesting(true);
    setError("");
    setSuggestions([]);
    try {
      const result = await suggestUsernames(values);
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err.status === 503 ? "Username suggestions are unavailable right now." : err.message);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { token, user } = await loginUser(loginForm);
      const nextSession = { token, id: user.id };
      localStorage.setItem("session", JSON.stringify(nextSession));
      setSession(nextSession);
      setLoginForm(emptyLogin);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    localStorage.removeItem("session");
    setSession(null);
    setProfile(null);
    setError("");
    setMessage("");
    setView("login");
  }

  return (
    <main className="page">
      <header className="site-header">
        <span className="brand">NagaEd</span>
        <span className="site-label">Account demo</span>
      </header>

      <section className="panel" aria-labelledby="page-title">
        {session ? (
          <>
            <div className="panel-heading">
              <p className="eyebrow">Dashboard</p>
              <h1 id="page-title">Your profile</h1>
              <p>Your account details are below.</p>
            </div>
            {loadingProfile ? <p className="status">Loading your account…</p> : null}
            {error ? <p className="error" role="alert">{error}</p> : null}
            {profile ? (
              <div className="profile">
                <p className="welcome">Welcome, {profile.username}.</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Address:</strong> {profile.address}</p>
              </div>
            ) : null}
            <button className="secondary-button" type="button" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <div className="panel-heading">
              <p className="eyebrow">Your account</p>
              <h1 id="page-title">{view === "login" ? "Log in" : "Create an account"}</h1>
              <p>{view === "login" ? "Enter your details to continue." : "Fill in the fields below to get started."}</p>
            </div>

            <div className="tabs" aria-label="Account pages">
              <button className={view === "login" ? "tab active" : "tab"} type="button" onClick={() => switchView("login")}>Log in</button>
              <button className={view === "register" ? "tab active" : "tab"} type="button" onClick={() => switchView("register")}>Register</button>
            </div>

            {message ? <p className="notice" role="status">{message}</p> : null}
            {error ? <p className="error" role="alert">{error}</p> : null}

            {view === "register" ? (
              <form onSubmit={handleRegister}>
                <label htmlFor="username">Username</label>
                <input id="username" name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} />

                <label htmlFor="interests">Interests (optional)</label>
                <input id="interests" name="interests" placeholder="e.g. music, coding" value={interests} onChange={(event) => { setInterests(event.target.value); setSuggestions([]); }} />
                <button className="secondary-button suggestion-trigger" type="button" disabled={suggesting || submitting} onClick={handleSuggestions}>{suggesting ? "Suggesting…" : "Suggest usernames"}</button>
                {suggestions.length > 0 ? (
                  <div className="suggestions" aria-label="Username suggestions">
                    {suggestions.map((name) => (
                      <button key={name} className="suggestion" type="button" onClick={() => setRegisterForm({ ...registerForm, username: name })}>{name}</button>
                    ))}
                  </div>
                ) : null}

                <label htmlFor="register-email">Email</label>
                <input id="register-email" name="email" type="email" autoComplete="email" required maxLength={254} value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />

                <label htmlFor="register-password">Password</label>
                <input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={8} value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />

                <label htmlFor="address">Address</label>
                <textarea id="address" name="address" autoComplete="street-address" required minLength={5} maxLength={500} rows={3} value={registerForm.address} onChange={(event) => setRegisterForm({ ...registerForm, address: event.target.value })} />

                <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <label htmlFor="login-email">Email</label>
                <input id="login-email" name="email" type="email" autoComplete="email" required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />

                <label htmlFor="login-password">Password</label>
                <input id="login-password" name="password" type="password" autoComplete="current-password" required value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />

                <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Logging in…" : "Log in"}</button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
