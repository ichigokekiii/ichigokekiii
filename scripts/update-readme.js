const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const USERNAME = "ichigokekiii";
const FEATURED_TOPIC = "featured";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function timeAgoWithTooltip(date) {
  const now = new Date();
  const updated = new Date(date);
  const diffDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

  let label;
  if (diffDays < 1) label = "Today";
  else if (diffDays === 1) label = "1 day ago";
  else if (diffDays < 30) label = `${diffDays} days ago`;
  else {
    label = `${diffDays} days ago`;
  }

  const fullDate = updated.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return `<span title="${fullDate}">${label}</span>`;
}

async function run() {
  const { data: repos } = await octokit.repos.listForUser({
    username: USERNAME,
    per_page: 100,
  });

  const featured = repos
    .filter(
      r =>
        !r.private &&
        r.topics &&
        r.topics.includes(FEATURED_TOPIC)
    )
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count)
        return b.stargazers_count - a.stargazers_count;
      return new Date(b.updated_at) - new Date(a.updated_at);
    })
    .slice(0, 15);

  const rows = featured.map(repo => {
    const desc = repo.description
      ? repo.description.slice(0, 100)
      : "No description";

    return `| [${repo.name}](https://github.com/${USERNAME}/${repo.name}) | ${desc} | ${repo.language || "N/A"} | ${repo.stargazers_count} | ${repo.forks_count} | ${timeAgoWithTooltip(repo.updated_at)} |`;
  });

  let readme = fs.readFileSync("README.md", "utf8");

  const start = readme.indexOf("| Repository | Description | Primary Language | Stars | Forks | Last Updated |");
  const end = readme.indexOf("\n\n", start);

  const table =
`| Repository | Description | Primary Language | Stars | Forks | Last Updated |
| ---------- | ----------- | ---------------- | ----- | ----- | ------------ |
${rows.join("\n")}`;

  readme =
    readme.slice(0, start) +
    table +
    (end !== -1 ? readme.slice(end) : "");

  fs.writeFileSync("README.md", readme);
}

run();
