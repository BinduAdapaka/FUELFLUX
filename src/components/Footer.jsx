import React from "react";

const Footer = () => {

  const currentYear = new Date().getFullYear();

  return (
    <footer className="ff-footer">
      <div className="ff-footer-top">
        <div className="ff-footer-grid">
          {/* Brand Column */}
          <div className="ff-footer-brand">
            <div className="ff-footer-logo">
              <div className="ff-logo-flame">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="14" fill="#1a1a1a" />
                  <path
                    d="M14 4C14 4 9 9 9 14.5C9 17.5 10.5 19.5 12.5 20.5C12 19 12.5 17.5 14 16.5C15.5 15.5 16 14 16 14C16 14 17.5 16 16 18C17.5 17.5 19 15.5 19 13.5C19 10 17 7 14 4Z"
                    fill="url(#flameGrad)"
                  />
                  <defs>
                    <linearGradient id="flameGrad" x1="14" y1="4" x2="14" y2="20.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF9800" />
                      <stop offset="1" stopColor="#FF5722" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="ff-footer-brand-name">FuelFlux</span>
            </div>
            <p className="ff-footer-tagline">
              Fueling the future with convenience and care.
            </p>
            <div className="ff-footer-socials">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ff-social-btn"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ff-social-btn"
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* About Us Column */}
          <div className="ff-footer-col">
            <h3 className="ff-footer-heading">About Us</h3>
            <p className="ff-footer-about-text">
              Fuel Flux is a next-generation on-demand fuel delivery platform. Our mission is to provide a reliable, eco-friendly alternative to traditional refuelling methods, saving customers valuable time while enhancing their overall experience.
            </p>
            <p className="ff-footer-about-text" style={{ marginTop: "8px" }}>
              Committed to sustainability, Fuel Flux promotes energy-efficient solutions while ensuring top-tier customer satisfaction.
            </p>
          </div>



          {/* Contact Column */}
          <div className="ff-footer-col">
            <h3 className="ff-footer-heading">Contact Us</h3>
            <ul className="ff-footer-contact-list">
              <li className="ff-contact-item">
                <span className="ff-contact-icon">📧</span>
                <a href="mailto:fuelflux55@gmail.com" className="ff-footer-link">
                  fuelflux55@gmail.com
                </a>
              </li>
              <li className="ff-contact-item">
                <span className="ff-contact-icon">🌐</span>
                <a href="https://fuelflux.in" target="_blank" rel="noopener noreferrer" className="ff-footer-link">
                  fuelflux.in
                </a>
              </li>
              <li className="ff-contact-item">
                <span className="ff-contact-icon">📍</span>
                <span className="ff-contact-text">India</span>
              </li>
            </ul>

            <div className="ff-footer-badge-row">
              <div className="ff-app-badge">
                <span>📱</span>
                <div>
                  <div style={{ fontSize: "9px", opacity: 0.7 }}>Download on the</div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>App Store</div>
                </div>
              </div>
              <div className="ff-app-badge">
                <span>🤖</span>
                <div>
                  <div style={{ fontSize: "9px", opacity: 0.7 }}>Get it on</div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="ff-footer-bottom">
        <div className="ff-footer-bottom-inner">
          <p className="ff-copyright">
            © {currentYear} All rights reserved by{" "}
            <span className="ff-copyright-brand">Fuel Flux Technology</span>
          </p>
          <div className="ff-footer-bottom-links">
            <a href="#" className="ff-footer-bottom-link">Privacy Policy</a>
            <span className="ff-dot">·</span>
            <a href="#" className="ff-footer-bottom-link">Terms of Service</a>
            <span className="ff-dot">·</span>
            <a href="#" className="ff-footer-bottom-link">Account Delete</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
