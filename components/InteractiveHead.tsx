"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

export function InteractiveHead() {
  const eyeRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (eyeRef.current) {
        const eyes = eyeRef.current.querySelectorAll(".eye");
        eyes.forEach((eye) => {
          const rect = eye.getBoundingClientRect();
          const eyeX = rect.left + rect.width / 2;
          const eyeY = rect.top + rect.height / 2;
          const angle = Math.atan2(event.clientY - eyeY, event.clientX - eyeX);
          const distance = Math.min(2, Math.hypot(event.clientX - eyeX, event.clientY - eyeY) / 20); // Subtle movement
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          eye.setAttribute('data-x', x.toString());
          eye.setAttribute('data-y', y.toString());
        });
      }
    };

    const animateEyes = () => {
      if (eyeRef.current) {
        const eyes = eyeRef.current.querySelectorAll(".eye");
        eyes.forEach((eye) => {
          const x = parseFloat(eye.getAttribute('data-x') || '0');
          const y = parseFloat(eye.getAttribute('data-y') || '0');
          if (eye instanceof HTMLElement) {
            eye.style.transform = `translate(${x}px, ${y}px)`;
          }
        });
      }
      if (isMountedRef.current) {
        requestAnimationFrame(animateEyes);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    animateEyes();

    const blinkLoop = async () => {
      while (isMountedRef.current) {
        await controls.start({ scaleY: 0.2 }); // Gentle blink
        await controls.start({ scaleY: 1 });
        await new Promise(resolve => setTimeout(resolve, 3500)); // Natural blink interval
      }
    };

    blinkLoop();

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [controls]);

  return (
    <div className="flex items-center justify-center">
      <div 
        ref={eyeRef} 
        className={cn(
          "relative w-10 h-10 rounded-full overflow-hidden",
          "bg-gradient-to-b from-black/90 via-gray-900/80 to-gray-800/70 backdrop-blur-md",
          "border border-gray-800/50"
        )}
      >
        {/* Left Eye */}
        <motion.div
          className="absolute w-[6px] h-[6px] bg-white rounded-full eye"
          style={{ left: '25%', top: '40%' }}
          animate={controls}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        />
        {/* Right Eye */}
        <motion.div
          className="absolute w-[6px] h-[6px] bg-white rounded-full eye"
          style={{ right: '25%', top: '40%' }}
          animate={controls}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}