import { Preloader } from "@/components/preloader";
import { Hud } from "@/components/hud";
import { Starfield } from "@/components/starfield";
import { TransitionGlitch } from "@/components/transition-glitch";
import { SceneEntry } from "@/components/scenes/entry";
import { SceneOrbital } from "@/components/scenes/orbital";
import { SceneDescent } from "@/components/scenes/descent";
import { SceneNode } from "@/components/scenes/node";
import { SceneUrban } from "@/components/scenes/urban";
import { SceneCore } from "@/components/scenes/core";
import { SceneManifest } from "@/components/scenes/manifest";

export default function Page() {
  return (
    <>
      {/* Fixed chrome sits outside the smoothed content, which is transformed. */}
      <Preloader />
      <Hud />
      <Starfield />
      <TransitionGlitch />

      <main id="top">
        <SceneEntry />
        <SceneOrbital />
        <SceneDescent />
        <SceneNode />
        <SceneUrban />
        <SceneCore />
        <SceneManifest />
      </main>
    </>
  );
}
