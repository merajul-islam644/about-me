import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

const App = () => {
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Hero/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/skills" element={<Skills/>}/>
        <Route path="/projects" element={<Projects/>}/>
        <Route path="/contact" element={<Contact/>}/>
      </Routes>
    </>
  );
};

export default App;
