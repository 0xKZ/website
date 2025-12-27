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
