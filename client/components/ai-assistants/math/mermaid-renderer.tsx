"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

interface MermaidRendererProps {
  chart: string
  className?: string
}

let mermaidRenderCounter = 0

const normalizeChartSource = (rawChart: string): string => {
  const trimmed = rawChart.trim()

  const fencedMatch = trimmed.match(/^```[ \t]*mermaid[ \t]*\r?\n([\s\S]*?)```$/i)
  if (fencedMatch) {
    return fencedMatch[1].trim()
  }

  return trimmed
}

const getMermaidTheme = (): "default" | "dark" => {
  if (typeof window === "undefined") {
    return "default"
  }

  const html = document.documentElement
  const dataTheme = html.getAttribute("data-theme")
  const classTheme = html.classList.contains("dark") ? "dark" : "default"

  if (dataTheme === "dark") {
    return "dark"
  }

  if (classTheme === "dark") {
    return "dark"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default"
}

export function MermaidRenderer({ chart, className }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [themeVersion, setThemeVersion] = useState(0)
  const latestRenderTokenRef = useRef(0)

  useEffect(() => {
    const html = document.documentElement
    const observer = new MutationObserver(() => {
      setThemeVersion((previous) => previous + 1)
    })

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const renderChart = async (): Promise<void> => {
      if (!containerRef.current) {
        return
      }

      const currentRenderToken = ++latestRenderTokenRef.current

      const normalizedChart = normalizeChartSource(chart)

      if (!normalizedChart) {
        setError("Empty Mermaid diagram")
        return
      }

      try {
        const element = containerRef.current
        if (!element) {
          return
        }

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: getMermaidTheme(),
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            wrappingWidth: 420,
            nodeSpacing: 28,
            rankSpacing: 36,
          },
          themeVariables: {
            fontSize: "11px",
            fontFamily: "inherit",
            background: "#ffffff00",
            primaryTextColor: getMermaidTheme() === "dark" ? "#e2e8f0" : "#0f172a",
            textColor: getMermaidTheme() === "dark" ? "#e2e8f0" : "#0f172a",
            lineColor: getMermaidTheme() === "dark" ? "#94a3b8" : "#475569",
            nodeTextColor: getMermaidTheme() === "dark" ? "#e2e8f0" : "#0f172a",
          },
        })

        const parseResult = await mermaid.parse(normalizedChart, { suppressErrors: true })
        if (parseResult === false) {
          throw new Error("Invalid Mermaid syntax")
        }

        const renderId = `mermaid-render-${++mermaidRenderCounter}`
        const { svg } = await mermaid.render(renderId, normalizedChart)

        if (
          currentRenderToken !== latestRenderTokenRef.current ||
          !containerRef.current ||
          !containerRef.current.isConnected
        ) {
          return
        }

        containerRef.current.innerHTML = svg

        const svgElement = containerRef.current.querySelector("svg")
        if (!svgElement) {
          throw new Error("Mermaid SVG missing")
        }

        svgElement.setAttribute("width", "100%")
        svgElement.style.maxWidth = "100%"
        svgElement.style.height = "auto"
        svgElement.style.display = "block"

        // Expand viewBox by 15% to effectively zoom out
        const vb = svgElement.viewBox.baseVal
        if (vb && vb.width > 0 && vb.height > 0) {
          const padX = vb.width * 0.08
          const padY = vb.height * 0.08
          svgElement.setAttribute(
            "viewBox",
            `${vb.x - padX} ${vb.y - padY} ${vb.width + padX * 2} ${vb.height + padY * 2}`
          )
        }

        setError(null)
      } catch (renderError) {
        if (currentRenderToken !== latestRenderTokenRef.current) {
          return
        }

        console.warn("Mermaid render warning. Falling back to raw diagram text.", renderError)
        setError("Failed to render Mermaid diagram")
      }
    }

    renderChart()

    return () => {
      latestRenderTokenRef.current += 1
    }
  }, [chart, themeVersion])

  if (error) {
    return (
      <pre className="bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto border border-slate-700 shadow-lg whitespace-pre font-mono text-sm leading-6">
        <code>{normalizeChartSource(chart) || chart}</code>
      </pre>
    )
  }

  return <div ref={containerRef} className={`mermaid ${className ?? "my-3 overflow-x-auto"}`} />
}
