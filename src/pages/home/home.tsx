import { useState } from "react";
import { InputToggle } from "../../components/apple-ish/input-toggle";
import { Page } from "../../components/page";

const HERO = "https://picsum.photos/1000";
const INLINE_1 = "https://picsum.photos/900";
const INLINE_2 = "https://picsum.photos/750";

export function Home() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <Page>
      <article className="article">
        <figure className="article__hero">
          <img src={HERO} alt="" crossOrigin="anonymous" />
        </figure>

        <header className="article__header">
          <p className="article__kicker">Design</p>
          <h1 className="article__title">
            How a Quiet Studio in Kyoto Is Redefining Craft
          </h1>
          <p className="article__dek">
            At Atelier Kōen, the line between object and art is being quietly
            rewritten — one hand-thrown vessel at a time.
          </p>
          <div className="article__byline">
            <div className="article__avatar" aria-hidden="true">
              RT
            </div>
            <div className="article__byline-meta">
              <p className="article__author">By Rei Takahashi</p>
              <p className="article__date">
                April 22, 2026 &middot; 8 min read
              </p>
            </div>
            <div className="article__byline-sub">
              <InputToggle
                checked={isChecked}
                onClick={() => setIsChecked(!isChecked)}
              />
            </div>
          </div>
        </header>

        <div className="article__body">
          <p className="article__lede">
            The studio is easy to miss. Tucked behind a sliding cedar door on a
            side street in Higashiyama, Atelier Kōen announces itself with
            nothing more than a small brass plate, oxidised to the colour of
            tea. Step inside and the city falls away; what remains is the
            muffled thrum of a potter&rsquo;s wheel and the soft perfume of damp
            clay.
          </p>

          <p>
            For nearly two decades, the studio&rsquo;s founder, Hinata Mori, has
            worked largely out of view. Her pieces &mdash; restrained vessels in
            pale celadon, charcoal stoneware with the blush of woodsmoke &mdash;
            are sold without fanfare, mostly to a handful of galleries in Paris,
            Milan and Copenhagen. Collectors speak of them in the hushed tones
            usually reserved for things that can only be inherited, never bought
            outright.
          </p>

          <p>
            &ldquo;I am not trying to make objects that impress,&rdquo; Mori
            says, pouring tea from a pot she made seven years ago. &ldquo;I am
            trying to make objects that listen.&rdquo;
          </p>

          <figure className="article__figure">
            <img src={INLINE_1} alt="" crossOrigin="anonymous" />
            <figcaption>
              Inside the studio, a workbench scattered with tools worn smooth by
              decades of use.
            </figcaption>
          </figure>

          <h2 className="article__subhead">The discipline of restraint</h2>

          <p>
            Mori&rsquo;s training began in a small mountain pottery north of
            Kyoto, where she spent the first three years of her apprenticeship
            doing almost nothing but preparing clay. The ritual, she recalls,
            was designed to teach patience before it taught anything else.
            &ldquo;You do not touch a wheel until your hands have forgotten that
            they are in a hurry.&rdquo;
          </p>

          <p>
            That philosophy threads through every surface in the studio. The
            shelves hold only what is in use. The kiln is swept each evening. A
            single branch of flowering quince sits in a narrow vase by the
            window, replaced every few days &mdash; not out of precious-ness,
            Mori insists, but because a studio that ignores the season soon
            starts ignoring itself.
          </p>

          <blockquote className="article__quote">
            &ldquo;There is a point in the making of a pot where you stop
            deciding and start listening. Everything before that is preparation.
            Everything after is faith.&rdquo;
          </blockquote>

          <p>
            It is a sentiment that could sound precious elsewhere. Here, in a
            room where even the light seems to have been edited, it simply
            sounds true.
          </p>

          <figure className="article__figure">
            <img src={INLINE_2} alt="" crossOrigin="anonymous" />
            <figcaption>
              A finished vessel, glazed in a celadon the colour of river mist.
            </figcaption>
          </figure>

          <h2 className="article__subhead">A growing quiet</h2>

          <p>
            In recent years, a small but insistent generation of makers has
            begun to orbit the studio. Some come for a week; others stay for a
            year. Mori does not advertise and does not teach, exactly. &ldquo;I
            put a kettle on,&rdquo; she says. &ldquo;They decide what else
            happens.&rdquo;
          </p>

          <p>
            What they appear to be learning is not a technique so much as a
            temperament &mdash; a way of treating material, and by extension
            time, as something to be entered rather than conquered. In an
            industry increasingly defined by volume and velocity, it is a quiet
            that feels, if not radical, then at least precious.
          </p>

          <p>
            Before the light fails, Mori walks a visitor to the door. She
            pauses, as if remembering something, and then doesn&rsquo;t say it.
            A bow, a slow smile, the cedar door sliding closed. Outside, the
            city resumes.
          </p>

          <p className="article__signoff">&mdash;</p>
        </div>

        <footer className="article__footer">
          <p>Photography by Yuki Hasegawa.</p>
          <p>All images used for demonstration purposes only.</p>
        </footer>
      </article>
    </Page>
  );
}
