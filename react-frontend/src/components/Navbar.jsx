import React, { useState } from "react";
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
                        <a href="/" className="nav-link" onClick={toggleMenu}>Home</a>
                    </li>
                    <li className="nav-item"> 
                        <a href="/search" className="nav-link" onClick={toggleMenu}>Search</a>
                    </li>
                    <li className="nav-item">  
                        <a href="/profile" className="nav-link" onClick={toggleMenu}>My Profile</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;