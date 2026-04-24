import { Nav } from "../../components/apple-ish/nav";
import { InputToggle } from "../../components/apple-ish/input-toggle";
import { ListGroup } from "../../components/apple-ish/list-group";
import { Title } from "../../components/apple-ish/title";
import { Page } from "../../components/page";
import {
  ChevronLeft,
  Home,
  MessageSquare,
  Music,
  Podcast,
  Settings,
} from "lucide-react";
import { useViewTransitionNavigate } from "../../hooks/useViewTransitionNavigate";

export function SettingsPage() {
  const navigate = useViewTransitionNavigate();

  return (
    <Page>
      <Title label="Settings" />

      <ListGroup>
        <ListGroup.Item
          icon=""
          label="Airplane Mode"
          detail={<InputToggle />}
        />
        <ListGroup.Item
          icon=""
          label="Wi-Fi"
          detail="_Wifi 2"
          onClick={() => {}}
        />
        <ListGroup.Item
          icon=""
          label="Bluetooth"
          detail="On"
          onClick={() => {}}
        />
        <ListGroup.Item icon="" label="Mobile Service" onClick={() => {}} />
        <ListGroup.Item icon="" label="VPN" detail={<InputToggle />} />
      </ListGroup>

      <ListGroup>
        <ListGroup.Item icon="" label="General" onClick={() => {}} />
        <ListGroup.Item icon="" label="Accessibility" onClick={() => {}} />
        <ListGroup.Item icon="" label="Camera" onClick={() => {}} />
        <ListGroup.Item icon="" label="Control Centre" onClick={() => {}} />
        <ListGroup.Item
          icon=""
          label="Display & Brightness"
          onClick={() => {}}
        />
        <ListGroup.Item icon="" label="Search" onClick={() => {}} />
        <ListGroup.Item icon="" label="Siri" onClick={() => {}} />
        <ListGroup.Item icon="" label="Standby" onClick={() => {}} />
        <ListGroup.Item icon="" label="Wallpaper" onClick={() => {}} />
        <ListGroup.Item icon="" label="VPN" detail={<InputToggle />} />
      </ListGroup>

      <ListGroup>
        <ListGroup.Item icon="" label="Notifications" onClick={() => {}} />
        <ListGroup.Item icon="" label="Sounds & Haptics" onClick={() => {}} />
        <ListGroup.Item icon="" label="Focus" onClick={() => {}} />
        <ListGroup.Item icon="" label="Screen Time" onClick={() => {}} />
      </ListGroup>

      <Nav location="top">
        <Nav.Fab
          Icon={<ChevronLeft />}
          onClick={() => navigate("/", { direction: "back" })}
        />
      </Nav>

      <Nav>
        <Nav.Bar
          items={[
            { id: "music", label: "Music", icon: <Music /> },
            { id: "podcast", label: "Podcast", icon: <Podcast /> },
          ]}
          defaultValue="music"
          onChange={(id) => console.log(id)}
        />
      </Nav>
    </Page>
  );
}
