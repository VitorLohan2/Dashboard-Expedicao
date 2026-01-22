// src/components/Header.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckFast } from "@fortawesome/free-solid-svg-icons";
import "../styles/Header.css";

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <FontAwesomeIcon icon={faTruckFast} className="header-icon" />
        <span className="header-title">DIME -Expedição</span>
      </div>
    </header>
  );
};

export default Header;
