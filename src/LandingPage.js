import React, { useState, useEffect, useRef } from "react";
import Typed from "react-typed";
import "./LandingPage.scss";
import "animate.css/animate.min.css";
import "font-awesome/css/font-awesome.min.css";
import { FaItchIo } from 'react-icons/fa';
import LoadingScreen from "./LoadingScreen";

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    handleTyping();
  }, []);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleShowHideSidebar = () => {
    if (isOpen) {
      setSidebarOpen(false);
      setIsOpen(false);
    } else {
      setSidebarOpen(true);
      setIsOpen(true);
    }
  };
  

  const handleSideBarClick = (target) => {
    setIsOpen(!isOpen);
    const targetElement = document.querySelector(target);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth",
      });
    }

    setSidebarOpen(false);
  };

  const handleTyping = () => {
    const options = {
      strings: [
        "a Computer Science Student",
        "a Passionate bookworm",
        "a Music lover",
        "a Creative Mind on a Journey",
      ],
      typeSpeed: 50,
      backSpeed: 30,
      startDelay: 200,
      backDelay: 600,
      loop: true,
      showCursor: true,
      cursorChar: "|",
    };

    return (
      <Typed
        className="element"
        strings={options.strings}
        typeSpeed={options.typeSpeed}
        startDelay={options.startDelay}
        backDelay={options.backDelay}
        loop={options.loop}
        showCursor={options.showCursor}
        cursorChar={options.cursorChar}
        backSpeed={options.backSpeed}
      />
    );
  };

  return (
    <div>
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-content">
          <LoadingScreen />
          </div>
        </div>
      )}
      {/* Navigation */}
      <div className="container-fluid fill light-white-font">
        <div id="menu-button">
        <div id="ham" className={`ham ${isOpen ? 'open' : ''}`} onClick={handleShowHideSidebar}>
  <div>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</div>
</div>
        
        <nav
          id="sidebar"
          className={`hidden ${sidebarOpen ? "slideInLeft" : "slideOutLeft"}`}
        >
          <ul className="nav nav-pills nav-stacked list-group">
            <li className="text-uppercase">
              <a href="#home" onClick={() => handleSideBarClick("#home")}>
                Home
              </a>
            </li>
            <li className="text-uppercase">
              <a
                href="#projects"
                onClick={() => handleSideBarClick("#projects")}
              >
                Projects
              </a>
            </li>
            <li className="text-uppercase">
              <a href="#about" onClick={() => handleSideBarClick("#about")}>
                About
              </a>
            </li>
            <li className="text-uppercase">
              <a href="#footer" onClick={() => handleSideBarClick("#footer")}>
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Home Section */}
      <div id="home" className="home-section fill dark-gray-background">
        <h1 className="center text-center">
          <p>
            Hi, my name is{" "}
            <strong className="middle-blue-font">Armaan Batra</strong>
          </p>
          <p>and I'm {handleTyping()}</p>
          
          <p>
            from <strong className="middle-blue-font">New Delhi</strong>.
          </p>
        </h1>
      </div>

      {/* Projects Section */}
      <div id="projects" className="container-fluid light-white-font">
        <h2 className="text-uppercase dark-gray-font">Projects</h2>
        <br />
        {/* Project List */}
        <div className="container dark-gray-font">
          <div className="row">
            {/* Project 1 */}
            <div className="col-md-4">
              <div className="panel panel-default fixed-width center-block">
                <div className="panel-body">
                  <a
                    href="https://github.com/ArmaanLeg3nd/FPS_Kaos_Proto"
                    target="gh-kaos"
                  >
                    <img
                      className="img-responsive center-block"
                      src={require("./unity-logo.png")}
                      alt="Project 1"
                    />
                  </a>
                </div>
                <div className="panel-footer">
                  <h3>kaos</h3>
                  <p>An FPS made in Unity.</p>
                </div>
              </div>
            </div>
            {/* Project 2 */}
            <div className="col-md-4">
              <div className="panel panel-default fixed-width center-block">
                <div className="panel-body">
                  <a
                    href="https://github.com/ArmaanLeg3nd/Disk-Overflow"
                    target="gh-disk-overflow"
                  >
                    <img
                      className="img-responsive center-block"
                      src={require("./react-logo.png")}
                      alt="Project 2"
                      height={300}
                      width={300}
                    />
                  </a>
                </div>
                <div className="panel-footer">
                  <h3>disk-overflow</h3>
                  <p>Educational Storytelling Website for Underprivileged Children.</p>
                </div>
              </div>
            </div>
            {/* Project 3 */}
            <div className="col-md-4">
              <div className="panel panel-default fixed-width center-block">
                <div className="panel-body">
                  <a
                    href="https://github.com/ArmaanLeg3nd/NyanMew"
                    target="gh-NyanMew"
                  >
                    <img
                      className="img-responsive center-block"
                      src={require("./java-logo.png")}
                      alt="Project 3"
                    />
                  </a>
                </div>
                <div className="panel-footer">
                  <h3>nyanmew</h3>
                  <p>Virtual Pet for Emotional Well-being and Mental Health Support.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {/* Project 4 */}
            <div className="col-md-4">
              <div className="panel panel-default fixed-width center-block">
                <div className="panel-body">
                  <a
                    href="https://github.com/ArmaanLeg3nd/taob"
                    target="gh-taob"
                  >
                    <img
                      className="img-responsive center-block"
                      src={require("./unity-logo.png")}
                      alt="Project 4"
                    />
                  </a>
                </div>
                <div className="panel-footer">
                  <h3>taob: the adventures of the bean</h3>
                  <p>A 3D side-scroller made in Unity.</p>
                </div>
              </div>
            </div>
          
          </div>
        </div>
        
      </div>
      
      {/* About Section */}
      <div id="about" className="container-fluid">
        <h2 className="text-uppercase dark-gray-font text-center">About me</h2>
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-md-offset-1 col-sm-12 mx-auto">
              {" "}
              {/* Added "mx-auto" class */}
              <p className="dark-gray-font text-justify">
                Hey there! I'm a cheerful guy with an 
                insatiable love for science and technology. I have a particular 
                fondness for learning and believe that diving right in and
                getting your hands dirty is the best way to acquire new skills.
              </p>
              <p className="dark-gray-font text-justify">
                I am trying to increase my coding experience by
                working on a couple of projects. I've been really imterested in crackmes
                and reverse engineering lately. I also like to participate in
                hackathons as the thrill and pressure brings the best out of me.
              </p>
            </div>
            <div className="col-md-5 col-sm-12 mx-auto">
              {" "}
              {/* Added "mx-auto" class */}
              <p className="dark-gray-font text-justify">
                I'm open to new opportunities and challenges,
                and I'm always looking to learn new things.
                I'm an Undergraduate Student and currently on the lookout for experience as a Software Engineer.
              </p>
              <p className="dark-gray-font text-justify">
                I'm a commitment driven hardworker. While I may 
                not possess the mystical powers of the wizards,
                but I always get my stuff done.
              </p>
            </div>
          </div>
          <br />
          <br />
          <div className="container-fluid text-center">
            <a
                id="download-resume-btn"
                href="https://drive.google.com/uc?id=1DIsb8FPREDRvZrEjO1VUKZd5mUE2DvNs&export=download"
                className="text-center text-uppercase"
              >
            <button
              id="download-btn"
              type="button"
              name="email-btn"
              className="btn btn-default middle-blue-background center-block download"
            >
              
                <i className="fa fa-download"></i>&nbsp;DOWNLOAD CV
              
            </button>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer id="footer" className="container-fluid text-center">
        <br />
        <br />
        <br />
        <div>
          <div className="row">
            <div className="col-md-12 text-center">
                <a
                  id="download-resume-btn"
                  href="mailto:armaanbatracs14@gmail.com"
                  className="text-center text-uppercase"
                >
              <button
                id="email-btn"
                type="button"
                name="email-btn"
                className="btn btn-default middle-blue-background center-block email"
              >
                
                  <i className="fa fa-envelope"></i>&nbsp;EMAIL ME
              </button>
              </a>
              <br />
              <br />
              <br />
              <p className="text-center light-white-font">
                <a
                  className="middle-blue-font"
                  href="https://twitter.com/armaanleg3nd"
                  title="Follow me!"
                  target="twitter"
                >
                  <strong>
                    <i className="fa fa-twitter fa-2x"></i>
                  </strong>
                </a>
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                <a
                  className="middle-blue-font"
                  href="https://www.linkedin.com/in/armaan-batra-11b028220/"
                  title="Experience!"
                  target="linkedin"
                >
                  <strong>
                    <i className="fa fa-linkedin fa-2x"></i>
                  </strong>
                </a>
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                <a
                  className="middle-blue-font"
                  href="https://github.com/ArmaanLeg3nd"
                  title="Projects!"
                  target="github"
                >
                  <strong>
                    <i className="fa fa-github fa-2x"></i>
                  </strong>
                </a>
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                <a
                  className="middle-blue-font"
                  href="https://armaanlegend.itch.io/"
                  title="Games!"
                  target="itchio"
                >
                  <strong id="dis-icon">
                  <FaItchIo size={32} className="itch-icon" />
                  </strong>
                </a>
                  &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                <a
                  className="middle-blue-font"
                  href="https://instagram.com/armaan.batra14"
                  title="Instagram!"
                  target="instagram"
                >
                  <strong>
                    <i className="fa fa-instagram fa-2x"></i>
                  </strong>
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
