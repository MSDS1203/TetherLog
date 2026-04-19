import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import { getMe } from "../utils/api";
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);  
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (token) {
            loadUser();
        }
    }, []);

    async function loadUser() {
        try {
        const data = await getMe();
        setUser(data);
        } catch (err) {
        console.error(err);
        }
    }

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
                <div className="nav-user">
                    {user && (
                        <>
                        <span className="user-info">
                            {user.name || user.email} ({user.role})
                        </span>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                        </>
                    )}
                    </div>
            </div>
        </nav>
    );
};

export default Navbar;