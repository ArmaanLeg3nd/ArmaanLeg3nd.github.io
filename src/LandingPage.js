import React, { useState, useEffect } from "react";
import Typewriter from "typewriter-effect";
import "./LandingPage.scss";
import "font-awesome/css/font-awesome.min.css";
import { FaItchIo } from "react-icons/fa";
import LoadingScreen from "./LoadingScreen";
import useEasingScroll from "react-easing-scroll";

function adjustCardHeights() {
  const cards = document.querySelectorAll('.project-item');
  let maxHeight = 0;

  // Find the tallest card
  cards.forEach(card => {
    card.style.height = 'auto';
    const height = card.offsetHeight;
    if (height > maxHeight) {
      maxHeight = height;
    }
  });

  // Set all cards' height to the maximum height
  cards.forEach(card => {
    card.style.height = `${maxHeight}px`;
  });
}

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 2000);
  }, []);

  useEffect(() => {
    fetch("./projects.json")
      .then((response) => response.json())
      .then((data) => setProjects(data))
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);

  useEasingScroll("easeInOutQuad", 1500, "scrollToMe");

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

  const handleSideBarClick = () => {
    setIsOpen(!isOpen);
    setSidebarOpen(false);
  };

  const applyMaxWidthToFitContentToRows = () => {
    const rowElements = document.querySelectorAll(".col-md-4");
    rowElements.forEach((row) => {
      row.style.maxWidth = "fit-content";
    });
  };

  useEffect(() => {
    applyMaxWidthToFitContentToRows();
  }, []);

  useEffect(() => {
    adjustCardHeights();
    window.addEventListener('resize', adjustCardHeights);
    return () => window.removeEventListener('resize', adjustCardHeights);
  }, [projects]);

  const getImageSrc = (imagePath) => {
    return imagePath.startsWith("http") ? imagePath : require(`${imagePath}`);
  };

  return (
    <div style={{ overflowX: "hidden" }}>
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
          <div
            id="ham"
            className={`ham ${isOpen ? "open" : ""}`}
            onClick={handleShowHideSidebar}
          >
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
              <a
                href="#home"
                onClick={() => handleSideBarClick()}
                className="scrollToMe"
              >
                Home
              </a>
            </li>
            <li className="text-uppercase">
              <a
                href="#projects"
                onClick={() => handleSideBarClick()}
                className="scrollToMe"
              >
                Projects
              </a>
            </li>
            <li className="text-uppercase">
              <a
                href="#about"
                onClick={() => handleSideBarClick()}
                className="scrollToMe"
              >
                About
              </a>
            </li>
            <li className="text-uppercase">
              <a
                href="#footer"
                onClick={() => handleSideBarClick()}
                className="scrollToMe"
              >
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
          <p>
            and I'm{" "}
            <Typewriter
              options={{
                strings: [
                  "a Computer Science Student",
                  "a Passionate bookworm",
                  "a Music lover",
                  "a Tech Geek",
                ],
                autoStart: true,
                loop: true,
              }}
            />
          </p>

          <p>
            from <strong className="middle-blue-font">New Delhi</strong>.
          </p>
        </h1>
      </div>

      {/* Projects Section */}
      <div id="projects" className="container-fluid light-white-font">
        <h2 className="text-uppercase dark-gray-font">Projects</h2>
        <br />
        {/* Dynamically render projects */}
        <div className="container dark-gray-font project-grid">
          {projects.map((project, index) => (
            <div className="project-item" key={index}>
              <div className="panel panel-default">
                <div className="panel-body">
                  <a
                    href={project.link}
                    target={`gh-${project.name.toLowerCase()}`}
                    rel="noopener noreferrer"
                  >
                    <img
                      className="img-responsive project-image"
                      src={getImageSrc(project.image)}
                      alt={`Project ${index + 1}`}
                    />
                  </a>
                </div>
                <div className="panel-footer gap-10">
                  &nbsp;
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                </div>
              </div>
            </div>
          ))}
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
              <p className="dark-gray-font tj">
                Hey there! I'm a cheerful guy with an insatiable love for
                science and technology. I have a particular fondness for
                learning and believe that diving right in and getting your hands
                dirty is the best way to acquire new skills.
              </p>
              <p className="dark-gray-font tj">
                I am trying to increase my coding experience by working on a
                couple of projects. I've been really interested in crackmes and
                reverse engineering lately. I also like to participate in
                hackathons as the thrill and pressure brings the best out of me.
              </p>
            </div>
            <div className="col-md-5 col-sm-12 mx-auto">
              {" "}
              {/* Added "mx-auto" class */}
              <p className="dark-gray-font tj">
                I'm open to new opportunities and challenges, and I'm always
                looking to learn new things. I'm an Undergraduate Student and
                currently on the lookout for experience as a Software Engineer.
              </p>
              <p className="dark-gray-font tj">
                I'm a commitment driven hardworker. While I may not possess the
                mystical powers of the wizards, but I always get my stuff done.
              </p>
            </div>
          </div>
          <br />
          <br />
          <div className="container-fluid text-center">
            <a
              id="download-resume-btn"
              href="https://drive.google.com/uc?export=download&id=1DLP9ubBL6eeaWWgOHZfX-q7GhxEjLU8i"
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
                  href="https://www.linkedin.com/in/armaanbatra/"
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
