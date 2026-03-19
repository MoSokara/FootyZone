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
  teamsContainer.innerHTML = "";

  const count = +input.value;
  const min = +fromInput.value;
  const max = +toInput.value;

  if (count >= 1 && count <= 10 && min >= MINRATING && max <= MAXRATING) {
    const filteredTeams = teams.filter(
      (team) => team.rating >= min && team.rating <= max,
    );

    if (filteredTeams.length < count) {
      teamsContainer.innerHTML = `
        <div class="invalid-msg">
          <h2>Not enough teams</h2>
          <p>Available teams: ${filteredTeams.length}</p>
        </div>`;
      return;
    }

    const shuffled = filteredTeams.sort(() => 0.5 - Math.random());

    const selected = shuffled.slice(0, count);

    selected.forEach((team, i) => {
      createTeam(i + 1, team.name, team.logo, team.rating, team.league);
    });
  } else {
    teamsContainer.innerHTML = `
      <div class="invalid-msg">
        <h2>Error: INVALID</h2>
        <p>Min rating: 73<br />Max rating: 85</p>
        <p>Min teams: 1<br />Max teams: 10</p>
      </div>`;
  }
});
