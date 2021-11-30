###
#  Indicate that it's ok to perform jobs in parallel + silently.
#
#	 -j sets that the Makefile can use an inf number of threads to execute.
#  -s suppresses echos of the commands being run.
#  -O says that logs should come out in-order despite parallelism.
#
###
MAKEFLAGS += -j -s -O

.PHONY: setup reset lint local-db local-redis setup-client setup-server build-server build-client deepclean build clean deploy local test

# Run this target first to download all dependencies.
setup-client:
	rm -rf client/node_modules
	cd client && npm install

setup-server:
	rm -rf node_modules
	npm install

setup: setup-client setup-server
	echo "For local testing, "
	echo "1. Please make sure you've installed `mongodb`."
	echo "2. Please make sure you've installed `redis`."

local-redis:
	echo "[cache] Starting local redis..."
	pkill redis-server || true
	redis-server --port 7777 --daemonize yes

reset:
	echo "Killing all relevant processes..."
	pkill redis-server || true
	pkill mongod || true
	pkill node || true
	rm -rf local || true


lint:
	npm run lint
	cd client && npm run lint

local-db:
	# setup the test database dir.
	echo "[db] Setting up data directory."
	rm -rf local/db
	mkdir -p local/db

	echo "[db] Killing any existing mongod..."
	pkill mongod || true

	echo "[db] Starting mongo..."
	# start mongodb | fork the process.
	mongod --dbpath local/db --fork --logpath local/db.log

	# create test user.
	echo "[db] Initializing db contents (using dbinit.js)..."
	mongo admin < test/integration/dbinit.js
	echo "[db] Running!"

build-client:
		cd client && npx react-scripts build && cp -r build/* ../resources/
		echo "[INFO] Built client!"

build-server:
		node_modules/.bin/tsc -p src/
		echo "[INFO] Built server!"

# Builds the site and places all artifacts into /build
build: build-client build-server

# Removes all artifacts.
clean:
	rm -rf resources/*
	rm -rf local

test: build-server
	# perform a clean, and a new build in order
	echo "[INFO] Testing Server"

	# Run tests.
	npx jest --runInBand --verbose --detectOpenHandles --forceExit --projects test/integration test/unit

testci: build-server
	npx jest --runInBand --verbose --detectOpenHandles --forceExit --projects test/unit


# Run the local server. (DOES NOT REBUILD.)
local: local-db local-redis
	sleep 2s & open http://localhost:5000 &
	heroku local
	pkill redis-server || true
	pkill mongod || true
	# also this: mongo admin --eval "db.shutdownServer()"

dev: build local-db local-redis
	heroku local &
	echo "[OK] starting real-time edit server for front-end."
	cd client && yarn start
	pkill redis-server || true
	pkill mongod || true
	# also this: mongo admin --eval "db.shutdownServer()"

# Pushes the site.
deploy: build
	git checkout deploy
	git merge master
	git push origin deploy
