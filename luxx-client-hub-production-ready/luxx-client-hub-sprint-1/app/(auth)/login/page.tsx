import LoginForm from '@/components/LoginForm';

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">L</div>
        <p>LUXX SOCIALS</p>
        <h1>Your marketing,<br />beautifully organized.</h1>
        <span>Review content, approve posts and access everything your brand needs.</span>
      </section>
      <section className="login-panel"><LoginForm /></section>
    </main>
  );
}
