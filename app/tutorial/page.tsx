"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const menu = [
  {
    key: "starting",
    number: "I",
    title: "Starting a Match",
  },
  {
    key: "writer",
    number: "II",
    title: "Playing as a Writer",
  },
  {
    key: "judge",
    number: "III",
    title: "Playing as the Judge",
  },
  {
    key: "winner",
    number: "IV",
    title: "Choosing the Winner",
  },
  {
    key: "after",
    number: "V",
    title: "After the Match",
  },
  {
    key: "summary",
    number: "✦",
    title: "Quick Summary",
  },
];

const Tutorial: React.FC = () => {
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>(null);

  //checks if what was clicked on is already open, if yes, close, otherwise open
  function manageMenu(key: string) {
    const sectionIsAlreadyOpen = openSection === key;

    if (sectionIsAlreadyOpen) {
      setOpenSection(null);
    } else {
      setOpenSection(key);
    }
  }

  //gives back the jsx for the section the user wants to see
  function renderContent(key: string) {
    if (key === "starting") {
      return (
        <>
          <p>To start a match, you need to be registered and logged in.</p>

          <p>
            Go to the homepage and click the <strong>Lobby</strong> button.
            There, you can create a match room and invite two other players to join.
          </p>

          <figure className="tutorials-figure">
            <img
              src="/tutorials/lobby-create-match.png"
              alt="Lobby with Create Match button" //image described in textform, in case image is not found
            />
          </figure>

          <p>
            Once all three players are in the room, click{" "}
            <strong>Create Match</strong>.
          </p>

          <p>Before the match begins, each player chooses a role:</p>

          <p>Two players become <strong>Writers</strong></p>
          <p>One player becomes the <strong>Judge</strong></p>
         

          <p>You can also choose how many rounds the match will last.</p>
        </>
      );
    }

    if (key === "writer") {
      return (
        <>
          <p>
            As a writer, you and your opponent take turns building the same story.
          </p>

          <p>
            You both write toward the same story objective, but each of you has a
            different secret genre. Your goal is to make your genre shape the story
            more strongly than your opponent&apos;s genre.
          </p>
          <p>
            Your genre is shown in your genre field. Hover over it to read the full
            description. Your opponent cannot see your genre.
          </p>

          <p>
            When it is your turn, continue the story in a way that fits the shared
            objective and supports your genre.
          </p>

          <p>
            When it is your opponent&apos;s turn, your writing panel is covered by a
            porthole. You can still see what your opponent types into their story field.
          </p>

          <p>
            The judge may assign you a quote during the match. If you receive a quote,
            you must include it in the story within your next two turns. If you do not,
            you receive a penalty.
          </p>

          <p>
            At the end of the selected number of rounds, the judge decides whose genre
            had the strongest influence on the final story.
          </p>

          <p>
            <em>
              Write creatively, react quickly, and make your genre impossible to ignore.
            </em>
          </p>
        </>
      );
    }

    if (key === "judge") {
      return (
        <>
          <p>
            As the judge, you do not write the story. Your role is to observe both
            writers and decide who shaped the story more successfully.
          </p>

          <p>During the match, you have two special actions:</p>

          <h3 className="tutorials-subsection-title">Assign a Quote</h3>

          <p>
            You can assign a quote to either writer using{" "}
            <strong>Quote P1</strong> or <strong>Quote P2</strong>. The writer must
            include the quote within two of their own turns. Each writer can receive
            only one quote per match.
          </p>

          <h3 className="tutorials-subsection-title">Reduce Time</h3>

          <p>
            You can use <strong>Reduce Time</strong> to cut the active writer&apos;s
            remaining time to 45 seconds. Each writer can only be affected by Reduce
            Time once.
          </p>
        </>
      );
    }

    if (key === "winner") {
      return (
        <>
          <p>After the final round, the match enters the evaluation stage.</p>

          <p>
            The judge has 90 seconds to choose a winner using the{" "}
            <strong>Declare</strong> button.
          </p>

          <p>
            The winner should be the writer whose genre shaped the story most clearly
            and convincingly.
          </p>

          <p>
            If the judge does not choose a winner before the timer runs out, the match
            automatically ends in a tie.
          </p>
        </>
      );
    }

    if (key === "after") {
      return (
        <>
          <p>When the game is finished, your completed story is saved.</p>

          <p>
            Click the <strong>Stories</strong> button on the homepage to read your
            finished story.
          </p>

          <p>You can also browse stories written by other players and vote on them.</p>
        </>
      );
    }

    if (key === "summary") {
      return (
        <ul>
          <li>
            <strong>Writers:</strong> Take turns writing, follow the story objective,
            and secretly push the story toward your genre.
          </li>

          <li>
            <strong>Judge:</strong> Watch the story, assign quotes, reduce time, and
            decide whose genre dominated the final story.
          </li>

          <li>
            <strong>Goal:</strong> Create the most convincing story — or judge it wisely.
          </li>
        </ul>
      );
    }

    return null; //in case key is something weird
  }

type MenuItem = {
  key: string;
  number: string;
  title: string;
};
  function makeButton(menuItem: MenuItem) {
            const sectionIsOpen = openSection === menuItem.key;

            let buttonClassName = "footerPill tutorials-menu-item";

            if (sectionIsOpen) {
              buttonClassName = buttonClassName + " footerPillCenter";
            }

            return (
              <React.Fragment key={menuItem.key}>
                <button
                  className={buttonClassName}
                    onClick={() => {
                        manageMenu(menuItem.key);
                    }}
                >
                  <span style={{ color: "var(--gold)", marginRight: 12 }}>
                    {menuItem.number}
                  </span>

                  {menuItem.title}

                  <span style={{ marginLeft: "auto" }}>
                    {sectionIsOpen ? "−" : "+"}
                  </span>
                </button>

                {sectionIsOpen && (
                  <article className="tutorials-section">
                    {renderContent(menuItem.key)}
                  </article>
                )}
              </React.Fragment>
            );
          }

  return (
    <div className="tutorials-page gameStarryBg">
      <button onClick={()=>router.push("/")} className="cornerButton tutorials-back">
        ← EXIT
      </button>

      <div className="tutorials-astronaut" aria-hidden="true">
        <div className="tutorials-astronaut-inner">
          <img src="/astronaut.webp" alt="" />
        </div>
      </div>

      <div className="tutorials-content">
        <h1 className="lobby-title">TUTORIALS</h1>

        <div className="lobby-title-divider">✦</div>

        <p className="bottomPhaseStatus">✦ Feeling lost? ✦</p>

        <p className="home-description">
          You&apos;re at the right place!
          <br />
          Welcome to Storywars, a competitive writing game for three players.
          The writers take turns creating a shared story. Each writer has a secret
          genre and tries to guide the story in that direction. The judge watches
          the story unfold and decides who wins.

          <span className="home-description-cta">
            Improve your creative writing skills and quick thinking!
          </span>
        </p>

        <nav className="tutorials-menu">
          {menu.map(makeButton)} {/*goes through all Items in the menu and applies the buttonmaker function to them */}
        </nav>
      </div>
    </div>
  );
}
export default Tutorial;