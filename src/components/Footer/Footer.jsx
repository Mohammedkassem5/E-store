import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="col">
        <h4>Exclusive</h4>
        <p>Subscribe</p>
        <p>Get 10% off your first order</p>
        <input type="email" placeholder="Enter your email" />
      </div>
      <div className="col">
        <h4>Support</h4>
        <p>111 Bijoy sarani, Dhaka</p>
        <p>exclusive@gmail.com</p>
        <p>+88015-88888-9999</p>
      </div>
      <div className="col">
        <h4>Account</h4>
        <p>My Account</p>
        <p>Login / Register</p>
        <p>Cart</p>
        <p>Wishlist</p>
      </div>
      <div className="col">
        <h4>Quick Link</h4>
        <p>Privacy Policy</p>
        <p>Terms Of Use</p>
        <p>FAQ</p>
        <p>Contact</p>
      </div>
      <div className="col">
        <h4>Download App</h4>
       
        <div className="social-icons">
          <span>🌐</span>
          <span>📘</span>
          <span>📸</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
