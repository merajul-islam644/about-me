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
import CvPage from "./components/CvPage";
import { CvShelf, PortfolioShelf } from "./components/ShelfPage";
import { CvSectionPage } from "./components/cv/CvSectionPage";
import { RequireAuth, RedirectIfAuthenticated } from "./auth/guards";
import { PortfolioGate } from "./components/PortfolioGate";

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public showcase — anyone can browse. Signed-out visitors see the
            site's default content (served by the portfolio provider), signed-in
            users see their own. /cv* is the CV mode: the same landing layout
            with CV content, plus per-menu CV pages fed by section assignment. */}
        <Route element={<PortfolioGate />}>
          <Route path="/" element={<Hero />} />
          <Route path="/cv" element={<Hero />} />
          <Route
            path="/cv/about"
            element={<CvSectionPage pageKey="about" label="About" />}
          />
          <Route
            path="/cv/skills"
            element={<CvSectionPage pageKey="skills" label="Skills" />}
          />
          <Route
            path="/cv/projects"
            element={<CvSectionPage pageKey="projects" label="Projects" />}
          />
          <Route
            path="/cv/contact"
            element={<CvSectionPage pageKey="contact" label="Contact" />}
          />
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
        {/* The CV editor — the "Edit CV" destination. Sign-in gates the
            action, the portfolio gate guarantees the content (the editor
            saves through the same row as the portfolio). */}
        <Route
          path="/cv/edit"
          element={
            <RequireAuth>
              <PortfolioGate />
            </RequireAuth>
          }
        >
          <Route index element={<CvPage />} />
        </Route>
        {/* The two shelves — every saved portfolio (/library) and every
            saved CV (/cv/library) in one list each, openable (view or edit;
            opening makes it the one the public pages show) and deletable.
            Same gating as the editors: sign-in gates the action, the
            portfolio gate guarantees the content. */}
        <Route
          path="/library"
          element={
            <RequireAuth>
              <PortfolioGate />
            </RequireAuth>
          }
        >
          <Route index element={<PortfolioShelf />} />
        </Route>
        <Route
          path="/cv/library"
          element={
            <RequireAuth>
              <PortfolioGate />
            </RequireAuth>
          }
        >
          <Route index element={<CvShelf />} />
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
