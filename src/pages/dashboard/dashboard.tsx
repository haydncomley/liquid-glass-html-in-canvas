import { InputToggle } from "../../components/apple-ish/input-toggle";
import { ListGroup } from "../../components/apple-ish/list-group";
import { Title } from "../../components/apple-ish/title";
import { Page } from "../../components/page";
import { useViewTransitionNavigate } from "../../hooks/useViewTransitionNavigate";
import styles from "./dashboard.module.scss";
import {
  AlertTriangle,
  Home,
  MessageSquare,
  Settings,
  Volume1,
  Volume2,
} from "lucide-react";
import { InputSlider } from "../../components/apple-ish/input-slider/input-slider";
import { useEffect, useState } from "react";
import { Nav } from "../../components/apple-ish/nav";
import { MadeByMe } from "../../components/made-by-me";

function supportsCanvasDrawElement(): boolean {
  if (typeof CanvasRenderingContext2D === "undefined") return false;
  return (
    typeof (CanvasRenderingContext2D.prototype as CanvasRenderingContext2D)
      .drawElementImage === "function"
  );
}

export function DashboardPage() {
  const navigate = useViewTransitionNavigate();
  const [volume, setVolume] = useState(25);
  const [canvasDrawSupported, setCanvasDrawSupported] = useState(true);

  useEffect(() => {
    setCanvasDrawSupported(supportsCanvasDrawElement());
  }, []);

  return (
    <Page>
      <Title label="Liquid Glass Demo" />

      {!canvasDrawSupported ? (
        <div className={styles.flagWarning} role="alert">
          <AlertTriangle className={styles.flagWarningIcon} aria-hidden />
          <div className={styles.flagWarningBody}>
            <p className={styles.flagWarningTitle}>Browser flag required</p>
            <p className={styles.flagWarningText}>
              This demo uses the experimental HTML-in-Canvas API. Enable{" "}
              <code>chrome://flags/#canvas-draw-element</code> in Chrome (or
              Chrome Canary) and relaunch the browser to see the liquid-glass
              effect.
            </p>
          </div>
        </div>
      ) : null}

      <ListGroup>
        <ListGroup.Item
          label="iPhone Settings Demo"
          onClick={() => navigate("/settings")}
        />
      </ListGroup>

      <ListGroup label="UI Components">
        <ListGroup.Item
          label="Toggle Switch"
          detail={<InputToggle defaultChecked />}
        />
        <ListGroup.Item>
          <div className={styles.sliderContainer}>
            <Volume1 />
            <InputSlider defaultValue={volume} onChange={setVolume} />
            <Volume2 />
          </div>
        </ListGroup.Item>
        <ListGroup.Item label="Volume" detail={`${Math.round(volume)}%`} />
      </ListGroup>

      <Nav>
        <Nav.Bar
          items={[
            { id: "home", label: "Home", icon: <Home /> },
            {
              id: "chats",
              label: "Chats",
              icon: <MessageSquare />,
              badge: "9+",
            },
            { id: "settings", label: "Settings", icon: <Settings /> },
          ]}
          defaultValue="home"
          onChange={(id) => console.log(id)}
        />
      </Nav>

      <MadeByMe className="fixed max-md:bottom-26 max-md:left-1/2 max-md:-translate-x-1/2 md:top-1 md:right-3 z-100 max-md:grayscale max-md:contrast-75 max-md:opacity-50! max-md:hover:opacity-100!" />
    </Page>
  );
}
