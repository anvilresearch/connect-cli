# CLI for Anvil Connect
Work-in-progress rewrite of the CLI included with [Anvil Connect](https://github.com/anvilresearch/connect).


### Install

```bash
$ npm install -g anvil-connect-cli
```


### Generating an Anvil Connect project

To get started with Anvil Connect, you'll need to generate a "project", a
directory containing all the files you'll need to run and customize your auth
server. After installing the CLI, run `nvl init` in your shell inside a clean
directory.

**If running Docker via Boot2Docker on OS/X or Windows, see the
[warning](#warning-for-boot2docker-users) below**

```bash
$ nvl init
```

This command will prompt you for some essential information and choices about
your deployment.

```bash
# defaults to the name of the current directory
? What would you like to name your Connect instance?

# FQDN of the auth server
# This can be localhost, an IP address, or a (sub)domain
? What (sub)domain will you use? connect.example.io

# We recommend our default Docker setup, including
# support for running Anvil Connect, Redis, and nginx
# with Docker Compose. You can opt out of any or all
# of this if Docker isn't your cup of tea.
? Would you like to use Docker? Yes

# We can generate a Redis configuration and optional
# Dockerfile. You can also configure Anvil Connect to
# run against any Redis instance available over the
# network.
? Would you like to run Redis? Yes

# We recommend using nginx for SSL termination, load balancing,
# and caching of static assets. If you wish to employ other means
# answer "no".
? Would you like to run nginx? Yes

# With nginx or without it, be sure to use SSL in production
? Would you like to create a self-signed SSL cert? Yes

# If you opt "yes" to generating an SSL cert, you'll be
# prompted for the certificate subject information.
? Country Name (2 letter code) US
? State or Province Name (full name) South Dakota
? Locality Name (eg, city) Rapid City
? Organization Name (eg, company) Anvil Research, Inc
```

After you've entered all the requested information, the command will generate
everything you need to run Anvil Connect in production. See the generated README
file or complete [docs][docs] for instructions on how to run the server.


[docs]: https://github.com/anvilresearch/connect-docs

#### Warning for Boot2Docker Users
If you're running on a Mac or Windows computer using boot2docker (this includes
kitematic and docker-toolbox), then you must ensure that the project folder is
located somewhere underneath ```/Users/``` on OS/X or ```c:\Users\``` on Windows.
This is because boot2docker by default can only map subdirectories of these
folders into the Docker containers.

If the project folder exists within your home directory or your ```Documents```
folder, then it will work fine.

If you must locate the project folder elsewhere, see this
[StackOverlow post](http://stackoverflow.com/questions/30586949/how-do-i-map-volume-outside-c-users-to-container-on-windows)
for a possible procedure.

## MIT License

Copyright (c) 2015 [Anvil Research, Inc.](http://anvil.io)
