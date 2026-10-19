import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import { Route, Routes, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LoginPage from "./components/LoginPage";
import CallbackPage from "./components/CallbackPage";
import EditPage from "./components/EditPage";
import { RequireAuth, RedirectIfAuthenticated } from "./auth/guards";
import { PortfolioGate } from "./components/PortfolioGate";

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public showcase — anyone can browse. Signed-out visitors see the
            site's default content (served by the portfolio provider), signed-in
            users see their own. */}
        <Route element={<PortfolioGate />}>
          <Route path="/" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        {/* Building your own portfolio is the one gated action — signed-out
            visitors are sent to login (with returnTo=/edit) from here. */}
        <Route
          element={
            <RequireAuth>
              <PortfolioGate />
            </RequireAuth>
          }
        >
          <Route path="/edit" element={<EditPage />} />
        </Route>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        {/* Not wrapped in any guard: the user is by definition not yet
            authenticated when they land here. */}
        <Route path="/login/callback" element={<CallbackPage />} />
      </Routes>
    </>
  );
};

export default App;
