"use client";

import { useEffect, useId, useRef, useState } from "react";

import Image from "next/image";

import { Label, ProgressBar } from "@heroui/react";
import { gsap } from "gsap";

import { cn } from "@/lib/utils";

interface FullScreenLoaderProps {
  isLoading: boolean;
  text?: string;
  className?: string;
}

const INITIAL_PROGRESS = 16;
const VISIBLE_PROGRESS_CAP = 94;

function AnimatedBrandLogo() {
  const svgId = useId().replace(/:/g, "");
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetch("/logo-indonesiaasrihub.svg")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load SVG logo.");
        }

        return response.text();
      })
      .then((markup) => {
        if (isMounted) {
          setSvgMarkup(markup);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSvgMarkup("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const container = logoRef.current;

    if (!container || !svgMarkup) {
      return;
    }

    const svg = container.querySelector("svg");

    if (!svg) {
      return;
    }

    const rawPaths = Array.from(svg.children).filter((node): node is SVGPathElement => node.tagName === "path");

    if (rawPaths.length === 0) {
      return;
    }

    const namespace = "http://www.w3.org/2000/svg";
    const parseTranslateX = (path: SVGPathElement) => {
      const transform = path.getAttribute("transform") ?? "";
      const match = /translate\(([^,\s)]+)/.exec(transform);
      return match ? Number.parseFloat(match[1]) : 0;
    };

    const orderedPaths = [...rawPaths].sort((left, right) => parseTranslateX(left) - parseTranslateX(right));
    const indonesiaPaths = orderedPaths.slice(0, 10);
    const asriPaths = orderedPaths.slice(10, 14);
    const hubPaths = orderedPaths.slice(14);

    const defs = document.createElementNS(namespace, "defs");
    const indonesiaClipPath = document.createElementNS(namespace, "clipPath");
    const indonesiaClipPathId = `${svgId}-indonesia-clip`;
    indonesiaClipPath.setAttribute("id", indonesiaClipPathId);

    const indonesiaClipRect = document.createElementNS(namespace, "rect");
    indonesiaClipRect.setAttribute("x", "0");
    indonesiaClipRect.setAttribute("y", "0");
    indonesiaClipRect.setAttribute("width", "0");
    indonesiaClipRect.setAttribute("height", "0");
    indonesiaClipPath.append(indonesiaClipRect);
    defs.append(indonesiaClipPath);

    const createGroup = (label: string, paths: SVGPathElement[]) => {
      const group = document.createElementNS(namespace, "g");
      group.setAttribute("data-part", label);
      paths.forEach((path) => group.append(path));
      return group;
    };

    const indonesiaGroup = createGroup("indonesia", indonesiaPaths);
    const asriGroup = createGroup("asri", asriPaths);
    const hubGroup = createGroup("hub", hubPaths);

    svg.replaceChildren(defs, indonesiaGroup, asriGroup, hubGroup);

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Indonesia ASRI Hub");
    svg.classList.add("h-auto", "w-full");

    const indonesiaBox = indonesiaGroup.getBBox();
    indonesiaClipRect.setAttribute("x", `${indonesiaBox.x}`);
    indonesiaClipRect.setAttribute("y", `${indonesiaBox.y}`);
    indonesiaClipRect.setAttribute("height", `${indonesiaBox.height}`);
    indonesiaClipRect.setAttribute("clipPathUnits", "userSpaceOnUse");
    indonesiaGroup.setAttribute("clip-path", `url(#${indonesiaClipPathId})`);

    try {
      const box = svg.getBBox();

      if (box.width > 0 && box.height > 0) {
        const padX = box.width * 0.035;
        const padY = box.height * 0.14;
        svg.setAttribute(
          "viewBox",
          `${box.x - padX} ${box.y - padY} ${box.width + padX * 2} ${box.height + padY * 2}`,
        );
      }
    } catch {
      svg.setAttribute("viewBox", "620 1330 2580 640");
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(svg, { transformOrigin: "50% 50%" });
      gsap.set(indonesiaGroup, { opacity: 0, y: 18, filter: "blur(12px)" });
      gsap.set(asriGroup, { opacity: 0, scale: 0.96, transformOrigin: "50% 50%" });
      gsap.set(hubGroup, { opacity: 0, x: 12, y: -10, rotation: -4, transformOrigin: "50% 50%" });
      gsap.set(glowRef.current, { opacity: 0.12, scale: 0.88 });

      const intro = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      intro
        .fromTo(svg, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.52 }, 0)
        .to(
          glowRef.current,
          {
            opacity: 0.55,
            scale: 1,
            duration: 0.86,
          },
          0,
        )
        .to(
          indonesiaClipRect,
          {
            attr: {
              width: indonesiaBox.width,
            },
            duration: 1.02,
            ease: "power2.out",
          },
          0.16,
        )
        .to(
          indonesiaGroup,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.02,
          },
          0.16,
        )
        .to(
          asriGroup,
          {
            opacity: 1,
            scale: 1,
            duration: 0.74,
          },
          0.66,
        )
        .to(
          hubGroup,
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.56,
            ease: "power2.out",
          },
          1.02,
        )
        .to(
          glowRef.current,
          {
            opacity: 0.86,
            scale: 1.08,
            duration: 0.46,
          },
          1.3,
        )
        .to(
          svg,
          {
            y: -2,
            duration: 0.3,
            ease: "power1.out",
          },
          1.3,
        )
        .to(
          [svg, glowRef.current],
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.48,
            ease: "power2.out",
          },
          1.54,
        );

      gsap.to(glowRef.current, {
        opacity: 0.68,
        scale: 1.04,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.9,
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, [svgMarkup]);

  return (
    <div className="relative flex min-h-[6.5rem] w-full items-center justify-center bg-transparent px-2 py-2">
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-x-[14%] top-1/2 h-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(28,209,191,0.24)_0%,_rgba(245,138,31,0.14)_45%,_transparent_78%)] blur-3xl"
      />
      {svgMarkup ? (
        <div
          ref={logoRef}
          className="relative mx-auto w-full max-w-[17.5rem]"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : (
        <div className="relative mx-auto w-full max-w-[17.5rem]">
          <Image
            src="/logo-indonesiaasrihub.svg"
            alt="Indonesia ASRI Hub"
            width={320}
            height={80}
            className="h-auto w-full"
            priority
          />
        </div>
      )}
    </div>
  );
}

export function FullScreenLoader({ isLoading, text = "Loading ...", className }: FullScreenLoaderProps) {
  const [show, setShow] = useState(isLoading);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setProgress(INITIAL_PROGRESS);
      return;
    }

    setProgress(100);
    const timer = setTimeout(() => {
      setShow(false);
      setProgress(INITIAL_PROGRESS);
    }, 320);

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!show || !isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= VISIBLE_PROGRESS_CAP) {
          return current;
        }

        const delta = Math.max(1.8, (VISIBLE_PROGRESS_CAP - current) * 0.16);
        return Math.min(VISIBLE_PROGRESS_CAP, current + delta);
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, [isLoading, show]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white/92 px-6 transition-opacity duration-300",
        isLoading ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,95,91,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,138,31,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,250,252,0.98))]" />
      <div className="relative flex w-full max-w-[30rem] flex-col items-center gap-5 rounded-[2rem] border border-[rgba(11,114,105,0.1)] bg-white/88 px-6 py-8 shadow-[0_30px_80px_-32px_rgba(0,95,91,0.4)]">
        <AnimatedBrandLogo />
        <div className="space-y-2 text-center">
          <p className="text-balance font-semibold text-[1.05rem] text-[#17323f]">{text}</p>
          <p className="text-sm text-[#5d7280]">Menyiapkan akses ke dashboard Indonesia ASRI Hub.</p>
        </div>
        <div className="w-full max-w-sm">
          <ProgressBar aria-label="Loading" className="w-full" value={Math.round(progress)}>
            <Label className="text-[0.84rem] font-medium text-[#47616d]">Memuat akses</Label>
            <ProgressBar.Output className="text-[0.78rem] text-[#6a7f8b]" />
            <ProgressBar.Track className="!h-2.5 !rounded-full !bg-[rgba(11,114,105,0.12)]">
              <ProgressBar.Fill className="!rounded-full !bg-[linear-gradient(90deg,#005f5b_0%,#0b7269_58%,#f58a1f_100%)]" />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      </div>
    </div>
  );
}
