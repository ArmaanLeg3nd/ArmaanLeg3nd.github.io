import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import HashLoader from "react-spinners/HashLoader";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  const controls = useAnimation();

  useEffect(() => {
    const animation = async () => {
      await controls.start({ opacity: 1 });
      await controls.start({ opacity: 1 });
    };

    animation();
  }, [controls]);

  return (
    <div
      className = "terminal"
      initial={{ opacity: 0 }}
      animate={controls}
      transition={{ duration: 4 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle, #292C2E 0%, #222426 100%) no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "Metal Lord",
        textAlign: "center",
      }}
    >
      <div id="wrap">
        <span id="term"> 
<HashLoader color="#f66200" />
        </span>
      </div>
    </div>
  );
};

export default LoadingScreen;
