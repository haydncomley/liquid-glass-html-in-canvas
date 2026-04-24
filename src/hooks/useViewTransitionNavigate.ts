import { flushSync } from "react-dom";
import { useNavigate, type NavigateOptions, type To } from "react-router-dom";

type StartViewTransition = (cb: () => void | Promise<void>) => {
  finished: Promise<void>;
};

type Direction = "forward" | "back";

type NavOptions = NavigateOptions & { direction?: Direction };

export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  return (to: To, options?: NavOptions) => {
    const { direction = "forward", ...navOptions } = options ?? {};
    const start = (
      document as Document & { startViewTransition?: StartViewTransition }
    ).startViewTransition;

    if (typeof start !== "function") {
      navigate(to, navOptions);
      return;
    }

    const root = document.documentElement;
    root.dataset.navDirection = direction;

    const transition = start.call(document, () => {
      flushSync(() => {
        navigate(to, navOptions);
      });
    });

    transition.finished.finally(() => {
      delete root.dataset.navDirection;
    });
  };
}
