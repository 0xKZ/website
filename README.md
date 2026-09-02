# Public Website Repo

This is a public repository because I am too cheap to pay the money required to host a static page from a private repository.

The website is simple because it gets the job done and I want to minimize my maintenence effort.  I'm a web/frontend noob, and I want to spend my energy getting better at other things, so I am not particularly interested in becoming an expert here. Forgive me.


# Setup

## Install Node.js >= v18

### When using bash:

Just follow the 11ty instructions under quick start: https://www.11ty.dev/

### When using Fish Shell:

I've been using fish recently so instead I installed: https://github.com/jorgebucaran/nvm.fish

Note that I had to install Fisher first. Then I continued from the 11ty instructions.

### Windows + MSYS2/Mingw64

If on windows, I'm probably using MSYS2 / Mingw64 because I want a unix-like environment. On that platform, getting node set up is a little tricky, as of when I am writing this I used the 'nvm' solution from this stackoverflow answer: https://stackoverflow.com/a/74482783 

When I did that, `unzip` was unavailable, and so I got it via `pacman -S unzip`.

## Run the static site generator to test locally

```
npx @11ty/eleventy --serve
```

Click on the localhost link it spits out.

### Alternative: build & serve inside an Apple container (no Node on the Mac)

If you'd rather never run npm/Node on your Mac (e.g. to keep supply-chain
exposure off your machine), you can do the whole build+serve inside a
container. This uses the `container` CLI and the agent image from the
[pi-container](../pi-container) repo:

1. One-time setup (on the Mac): build the agent image
   `cd ../pi-container && ./scripts/build.sh`
2. From this repo:

```
./scripts/serve-in-container.sh
```

Then open http://localhost:4173 and press `Ctrl+C` to stop.

- `--port 9000` — publish on a different local port. The default is 4173,
  not 8080, so it doesn't clash with a local model server running on 8080.
- `--build-only` — just run the install + build (writes `_site/`) and exit,
  no server

How it works: a container starts on the `default` network (internet, so npm
can fetch packages *into the container*), runs `npm ci` (every package is
verified against the integrity hashes in `package-lock.json`), and starts
Eleventy's dev server, which is published to your Mac's localhost. The npm
cache persists in `~/.pi-container-npm/website/` between runs, so only the
first run downloads anything. Because `npm ci` wipes and reinstalls
`node_modules`, it also fixes the fact that a Mac-installed `node_modules`
contains native binaries (e.g. `sharp`) that don't work in a Linux container.


# Updating dependencies

... todo, write something useful here


# Publishing An Update

The website automatically updates via a workflow when a commit lands on the `main` branch.

See the github actions setup here:
```
.github/workflows/gh-pages.yml
```

On github, there's an 'evironment' set up called `github-pages`. This is configured to wait for 15 minutes before starting a workflow
after you push, in case you do something stupid.

Note that if you view the `github-pages` branch, the files in there are very limited as they are just the content of the website. Therefore, you should not be manually merging or pushing to this branch. The workflow takes care of that.

When you push a new commit to `main`, the deployment action there will kick off the deployment in the `gh-pages` branch, where you will see the 'check status' turn yellow while it waits the 15 minutes. You can click into there and override the timer to speed up the deployment when you are ready. The 15 minute timer is just there to help catch accidental pushes.
