import React, { useState } from "react";
import "./dashboard.css";
import ColorSection from "./sections/ColorSection";
import SpacingSection from "./sections/SpacingSection";
import TypographySection from "./sections/TypographySection";
import InteractionsSection from "./sections/InteractionsSection";
import ComponentsSection from "./sections/ComponentsSection";

type SectionType =
  | "colors"
  | "spacing"
  | "typography"
  | "interactions"
  | "components";

export function DesignSystemDashboard() {
  const [activeSection, setActiveSection] = useState<SectionType>("colors");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return (
    <div
      className="cic-dashboard"
      data-theme={theme}
      data-cic-dashboard="true"
    >
      {/* Header */}
      <header className="cic-dashboard-header">
        <div className="cic-dashboard-header-content">
          <h1>CIC Design System Dashboard</h1>
          <button
            className="cic-theme-toggle"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="cic-dashboard-nav">
        <button
          className={`cic-nav-item ${
            activeSection === "colors" ? "active" : ""
          }`}
          onClick={() => setActiveSection("colors")}
        >
          🎨 Colors
        </button>
        <button
          className={`cic-nav-item ${
            activeSection === "spacing" ? "active" : ""
          }`}
          onClick={() => setActiveSection("spacing")}
        >
          📏 Spacing
        </button>
        <button
          className={`cic-nav-item ${
            activeSection === "typography" ? "active" : ""
          }`}
          onClick={() => setActiveSection("typography")}
        >
          🔤 Typography
        </button>
        <button
          className={`cic-nav-item ${
            activeSection === "interactions" ? "active" : ""
          }`}
          onClick={() => setActiveSection("interactions")}
        >
          🖱️ Interactions
        </button>
        <button
          className={`cic-nav-item ${
            activeSection === "components" ? "active" : ""
          }`}
          onClick={() => setActiveSection("components")}
        >
          🧩 Components
        </button>
      </nav>

      {/* Content */}
      <main className="cic-dashboard-content">
        {activeSection === "colors" && <ColorSection />}
        {activeSection === "spacing" && <SpacingSection />}
        {activeSection === "typography" && <TypographySection />}
        {activeSection === "interactions" && <InteractionsSection />}
        {activeSection === "components" && <ComponentsSection />}
      </main>
    </div>
  );
}

export default DesignSystemDashboard;
