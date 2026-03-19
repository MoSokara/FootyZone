import {
  premierLeagueTeams,
  laLigaTeams,
  ligue1Teams,
  bundesligaTeams,
  serieATeams,
} from "./teams.js";

const input = document.getElementById("team-input");
const generateBtn = document.getElementById("generate-btn");
const teamsContainer = document.getElementById("teams-container");
// const matchesContainer = document.getElementById("matches-container");

let teams = [
  ...premierLeagueTeams,
  ...laLigaTeams,
  ...bundesligaTeams,
  ...ligue1Teams,
  ...serieATeams,
];

let temp = [];

function createTeam(playerNum, teamName, teamLogo, teamRate, teamLeague) {
  const team = document.createElement("div");
  team.classList.add("team");
  team.innerHTML = `<h2 class="team-player">Player ${playerNum}</h2>
        <img
          class="team-logo"
          src=${teamLogo}
          alt=""
        />
        <h2 class="team-name">${teamName}</h2>
        <p class="team-rate">Rating: ${teamRate}</p>
        <p class="team-league">League: ${teamLeague}</p>`;
  teamsContainer.appendChild(team);
}

// Rating inputs
const fromInput = document.getElementById("from-input");
const toInput = document.getElementById("to-input");
const MAXRATING = 85;
const MINRATING = 73;

generateBtn.addEventListener("click", () => {
  temp = [];
  teamsContainer.innerHTML = "";
  if (
    input.value >= 1 &&
    input.value <= 10 &&
    fromInput.value >= MINRATING &&
    toInput.value <= MAXRATING
  ) {
    for (let i = 1; i <= input.value; i++) {
      while (true) {
        let randomNum = Math.floor(Math.random() * teams.length);
        if (
          !temp.includes(teams[randomNum].name) &&
          teams[randomNum].rating >= fromInput.value &&
          teams[randomNum].rating <= toInput.value
        ) {
          createTeam(
            i,
            teams[randomNum].name,
            teams[randomNum].logo,
            teams[randomNum].rating,
            teams[randomNum].league,
          );
          temp.push(teams[randomNum].name);
          break;
        }
      }
    }
  } else {
    teamsContainer.innerHTML = `<div class="invalid-msg">
        <h2>Error: INVALID</h2>
        <p>Minumam rating: 73<br />Maxumam rating: 85</p>
        <p>Minumam Teams: 1<br />Maxumam Teams: 10</p>
      </div>`;
  }
});
