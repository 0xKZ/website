# Public Website Repo

This is a public repository because I don't want to pay money to host a static page from a private repository.

The website is ugly and simple because it gets the job done and I want to minimize my maintenence effort.

I'm a web/frontend noob, and I want to spend my energy getting better at other things, so I am not particularly interested in becoming an expert here. Forgive me.


# Setup

## Install Node.js >= v14

Just follow the 11ty instructions under quick start: https://www.11ty.dev/

### Windows + MSYS2/Mingw64

If on windows, I'm probably using MSYS2 / Mingw64 because I want a unix-like environment. On that platform, getting node set up is a little tricky, as of when I am writing this I used the 'nvm' solution from this stackoverflow answer: https://stackoverflow.com/a/74482783 

When I did that, `unzip` was unavailable, and so I got it via `pacman -S unzip`.

## Run the static site generator to test locally

```
npx @11ty/eleventy --serve
```

Click on the localhost link it spits out.


# Updating dependencies

Maintenance stuff...


