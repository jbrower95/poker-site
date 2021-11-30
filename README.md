# Sample Poker Site

## Getting Started

0. Make sure you have `npm` installed. (`brew install node`). Now, enter the `server` directory.

1. `make setup` installs all dependencies

1.5. You need to install MongoDB locally to run the website. See: https://docs.mongodb.com/manual/installation/

2. `make local` will start your local instance! View it at http://localhost:8080

3. When you make a change, kill the existing server and run `make local` again.

4. When you're confident in your change,
    0. Make sure your tests pass (`npm test`)
    1. Save your changes to Github :)

## Important

- Don't commit passwords, tokens, etc. into the codebase. ALWAYS USE ENV VARIABLES.
- Before you push to app-engine, make sure to test with `make test` at least.

## Contributing

- src/
This directory contains all of the source code for the server. (see README)
It's typescript, and has its own build step. (see Makefile 'build-server' step).

- client/
This directory contains all of the source code for the client. The client
uses React and has its own build process.

The client is built relative to '/resources/' so that we can effectively
route the static files for the React site properly. (see package.json).

- build/
The current build of the website. To rebuild, run:

`make build`

During the build step, we compile the server and client, and copy both
of their outputs into `build/`. `build/server` contains the server code,
and the rest of `build/` is a static directory served on the website.


## Commands

All build commands are currently set up in the Makefile.

to run the server locally:
`make local`

to clean the server build:
`make clean`
