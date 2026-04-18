import React, { useState } from "react";
import { Link } from "react-router-dom";
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);  

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="menu-icon" onClick={toggleMenu}>
                    <div className={`hamburger ${isOpen ? "open" : ""}`}>
                        <span></span>
                        <span></span>  
                        <span></span>
                    </div>
                </div>  

                <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
                    <li className="nav-item">
                        <Link to="/dashboard" className="nav-link" onClick={toggleMenu}>Home</Link>
                    </li>
                    <li className="nav-item"> 
                        <Link to="/search" className="nav-link" onClick={toggleMenu}>Search</Link>
                    </li>
                    <li className="nav-item">  
                        <Link to="/profile" className="nav-link" onClick={toggleMenu}>My Profile</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;